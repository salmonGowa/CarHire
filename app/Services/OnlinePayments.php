<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\OnlinePayment;
use App\Models\Payment;
use App\Models\User;
use App\Services\Payments\CardGateway;
use App\Services\Payments\MpesaGateway;
use App\Services\Payments\MpesaResult;
use App\Services\Payments\PaymentGatewayException;
use App\Support\PhoneNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Collecting money online: M-PESA STK prompts and card checkouts.
 *
 * Each attempt is an OnlinePayment. It settles exactly once, from whichever
 * arrives first: the provider's callback/webhook, the customer's browser
 * checking in, or the reconcile job. Success records an ordinary Payment, so
 * invoices, receipts, commission and payouts work as for payments staff record.
 */
class OnlinePayments
{
    public function __construct(
        private MpesaGateway $mpesa,
        private CardGateway $card,
        private FinanceService $finance,
        private Notifier $notifier,
    ) {}

    // ── Starting a payment ────────────────────────────────────────────────────

    /** Send an STK prompt to a phone. Staff can send one to the customer's phone too. */
    public function startMpesa(User $actor, Booking $booking, string $phone, ?int $amount = null): OnlinePayment
    {
        [$invoice, $amount] = $this->payable($booking, $amount);
        $msisdn = PhoneNumber::toE164($phone);
        if (! $msisdn) {
            throw ValidationException::withMessages(['phone' => 'Enter a Safaricom number, like 0712 345 678.']);
        }
        $msisdn = ltrim($msisdn, '+');

        $this->expireStale($booking);
        $waiting = $booking->onlinePayments()->pending()->where('provider', 'mpesa')->latest('id')->first();
        if ($waiting) {
            throw ValidationException::withMessages(['phone' => 'A prompt was sent to '.self::maskPhone($waiting->phone).' a moment ago. Answer it on the phone, or wait '.OnlinePayment::EXPIRES_AFTER_MINUTES['mpesa'].' minutes for it to expire.']);
        }

        $intent = OnlinePayment::create([
            ...$this->base($actor, $booking, $invoice, $amount),
            'provider' => 'mpesa', 'driver' => $this->mpesa->name(), 'phone' => $msisdn,
        ]);

        try {
            $prompt = $this->mpesa->stkPush($msisdn, $amount, $booking->reference, 'DriveFleet hire');
        } catch (PaymentGatewayException $e) {
            Log::warning("M-PESA prompt failed for {$booking->reference}: {$e->getMessage()}");
            $intent->update(['status' => OnlinePayment::FAILED, 'result_desc' => $e->getMessage(), 'completed_at' => now()]);
            throw ValidationException::withMessages(['phone' => "M-PESA couldn't send the prompt right now. Try again in a minute, or pay another way."]);
        }

        $intent->update(['checkout_id' => $prompt['checkout_id'], 'merchant_request_id' => $prompt['merchant_request_id']]);
        AuditLog::record('payment.mpesa_prompt', 'Sent an M-PESA prompt for KSh '.number_format($amount)." on {$booking->reference} to ".self::maskPhone($msisdn), $booking, actor: $actor);

        return $intent;
    }

    /**
     * Start a hosted card checkout. The customer is sent to `authorization_url`
     * and comes back to the return route, which settles the attempt.
     *
     * @return array{0: OnlinePayment, 1: string}
     */
    public function startCard(User $actor, Booking $booking, string $returnUrl, ?int $amount = null): array
    {
        [$invoice, $amount] = $this->payable($booking, $amount);
        $email = $booking->customer_email ?: $actor->email;
        $intent = OnlinePayment::create([
            ...$this->base($actor, $booking, $invoice, $amount),
            'provider' => 'card', 'driver' => $this->card->name(), 'email' => $email,
        ]);

        try {
            $checkout = $this->card->initialize($intent->reference, $amount, $email, $returnUrl);
        } catch (PaymentGatewayException $e) {
            Log::warning("Card checkout failed for {$booking->reference}: {$e->getMessage()}");
            $intent->update(['status' => OnlinePayment::FAILED, 'result_desc' => $e->getMessage(), 'completed_at' => now()]);
            throw ValidationException::withMessages(['amount' => "Card payments aren't available right now. Try again later, or pay by M-PESA."]);
        }
        $intent->update(['checkout_id' => $checkout['checkout_id']]);

        return [$intent, $checkout['authorization_url']];
    }

    // ── Finding out what happened ─────────────────────────────────────────────

    /** Ask the provider about a pending attempt (rate-limited unless forced). */
    public function refresh(OnlinePayment $payment, bool $force = false): OnlinePayment
    {
        if (! $payment->isPending() || (! $force && $payment->last_checked_at?->gt(now()->subSeconds(5)))) {
            return $payment;
        }

        try {
            $result = match (true) {
                $payment->provider === 'mpesa' && $payment->checkout_id !== null => $this->mpesa->query($payment->checkout_id),
                $payment->provider === 'card' => $this->card->verify($payment->reference),
                default => ['status' => 'pending'],
            };
        } catch (PaymentGatewayException $e) {
            Log::info("Couldn't check {$payment->reference}: {$e->getMessage()}");
            $result = ['status' => 'pending'];
        }
        $payment->update(['last_checked_at' => now()]);

        $this->settle($payment, $result['status'], $result['result_code'] ?? null,
            $payment->provider === 'mpesa' && isset($result['result_code']) ? MpesaResult::message($result['result_code'], $result['result_desc'] ?? null) : ($result['result_desc'] ?? null),
            $result['receipt'] ?? null, $result['amount'] ?? null);

        if ($payment->refresh()->isExpired()) {
            $payment->update(['status' => OnlinePayment::EXPIRED, 'result_desc' => $payment->provider === 'mpesa' ? 'The prompt wasn\'t answered in time.' : 'The card checkout wasn\'t finished.', 'completed_at' => now()]);
        }

        return $payment;
    }

    /**
     * Daraja's STK callback.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleMpesaCallback(array $payload): ?OnlinePayment
    {
        $callback = data_get($payload, 'Body.stkCallback');
        $payment = is_array($callback) && isset($callback['CheckoutRequestID'])
            ? OnlinePayment::where('provider', 'mpesa')->where('checkout_id', $callback['CheckoutRequestID'])->first()
            : null;
        if (! $payment) {
            Log::warning('M-PESA callback for an unknown prompt', ['payload' => $payload]);

            return null;
        }

        $meta = collect(data_get($callback, 'CallbackMetadata.Item', []))->mapWithKeys(fn ($i) => [$i['Name'] ?? '' => $i['Value'] ?? null]);
        $code = (string) ($callback['ResultCode'] ?? '');
        if ($payment->isPending()) {
            $payment->update(['payload' => $payload]);
        }
        $this->settle($payment, MpesaResult::status($code), $code, MpesaResult::message($code, $callback['ResultDesc'] ?? null),
            $meta['MpesaReceiptNumber'] ?? null, isset($meta['Amount']) ? (int) round((float) $meta['Amount']) : null);

        return $payment->refresh();
    }

    /** A provider webhook said something happened to a card checkout: check with the provider. */
    public function handleCardEvent(string $reference): ?OnlinePayment
    {
        $payment = OnlinePayment::where('provider', 'card')->where('reference', $reference)->first();

        return $payment ? $this->refresh($payment, force: true) : null;
    }

    /**
     * Catch up on attempts whose callback never came (the scheduler runs this).
     *
     * @return array{checked: int, succeeded: int, expired: int}
     */
    public function reconcile(): array
    {
        $counts = ['checked' => 0, 'succeeded' => 0, 'expired' => 0];
        OnlinePayment::pending()->where('created_at', '<=', now()->subSeconds(30))->orderBy('id')->each(function (OnlinePayment $p) use (&$counts) {
            $this->refresh($p, force: true);
            $counts['checked']++;
            $counts['succeeded'] += (int) ($p->status === OnlinePayment::SUCCEEDED);
            $counts['expired'] += (int) ($p->status === OnlinePayment::EXPIRED);
        });

        return $counts;
    }

    // ── Settling ──────────────────────────────────────────────────────────────

    private function settle(OnlinePayment $payment, string $status, ?string $code, ?string $description, ?string $receipt, ?int $paidAmount): void
    {
        if ($status === 'pending') {
            return;
        }

        DB::transaction(function () use ($payment, $status, $code, $description, $receipt, $paidAmount) {
            $locked = OnlinePayment::whereKey($payment->id)->lockForUpdate()->first();
            if (! $locked->isPending()) {
                return; // already settled by the callback, the browser or the reconcile job
            }

            if ($status !== 'succeeded') {
                $locked->update(['status' => $status === 'cancelled' ? OnlinePayment::CANCELLED : OnlinePayment::FAILED,
                    'result_code' => $code, 'result_desc' => $description, 'completed_at' => now()]);

                return;
            }

            $locked->update(['status' => OnlinePayment::SUCCEEDED, 'result_code' => $code, 'result_desc' => $description,
                'receipt' => $receipt, 'completed_at' => now()]);
            $this->recordReceived($locked, $paidAmount ?? $locked->amount, $receipt);
        });
    }

    /** Turn money that arrived into a Payment on the invoice, flagging anything odd for a person. */
    private function recordReceived(OnlinePayment $online, int $amount, ?string $receipt): void
    {
        $booking = $online->booking;
        $label = $online->provider === 'mpesa' ? 'M-PESA' : 'card';

        // Staff may already have typed this M-PESA code in by hand.
        $existing = $receipt ? Payment::where('transaction_code', $receipt)->first() : null;
        if ($existing) {
            $online->update(['payment_id' => $existing->id]);

            return;
        }

        try {
            $payment = DB::transaction(fn () => $this->finance->recordPayment($online->initiator ?? $booking->customer, $booking, [
                'amount' => $amount,
                'method' => $online->provider,
                'transaction_code' => $receipt,
                'notes' => "Paid online by {$label} ({$online->reference})",
            ], allowOverpayment: true));
        } catch (Throwable $e) {
            // The money arrived but couldn't go on the invoice (e.g. the booking was cancelled meanwhile).
            report($e);
            $online->update(['result_desc' => "Received, but couldn't be added to the invoice: {$e->getMessage()}"]);
            $this->notifier->superAdmins('Online payment needs attention',
                'KSh '.number_format($amount)." {$label} payment {$online->reference} for {$booking->reference} arrived but couldn't be recorded on the invoice. Check it and refund or record it by hand.",
                '/superadmin-revenue', 'error', 'payment');

            return;
        }

        $online->update(['payment_id' => $payment->id]);
        AuditLog::record('payment.online', 'Received KSh '.number_format($amount)." by {$label} online on {$booking->reference}", $payment, actor: $online->initiator);
        DB::afterCommit(function () use ($booking, $amount, $label, $payment) {
            $this->notifier->dealerStaff($booking->dealer_id, 'Online payment received',
                'KSh '.number_format($amount)." by {$label} for {$booking->reference} ({$booking->customer_name}).", '/dealer-payments', 'success', 'payment');
            $invoice = Invoice::find($payment->invoice_id);
            if ($invoice && $invoice->amount_paid > $invoice->total) {
                $this->notifier->dealerStaff($booking->dealer_id, 'Booking overpaid',
                    "{$booking->reference} has been paid KSh ".number_format($invoice->amount_paid - $invoice->total).' more than its invoice. Refund the difference from Payments.', '/dealer-payments', 'warning', 'payment');
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** @return array{0: Invoice, 1: int} */
    private function payable(Booking $booking, ?int $amount): array
    {
        if (! in_array($booking->status, [BookingStatus::Confirmed, BookingStatus::Active, BookingStatus::Completed], true)) {
            throw ValidationException::withMessages(['amount' => 'You can pay once the dealer has confirmed the booking.']);
        }
        $invoice = $this->finance->issueInvoice($booking);
        if ($invoice->voided_at !== null) {
            throw ValidationException::withMessages(['amount' => 'This invoice has been voided.']);
        }
        $balance = $invoice->balance();
        if ($balance === 0) {
            throw ValidationException::withMessages(['amount' => 'Nothing is due on this booking.']);
        }
        $amount ??= $balance;
        if ($amount < 1 || $amount > $balance) {
            throw ValidationException::withMessages(['amount' => 'Enter an amount up to the balance of KSh '.number_format($balance).'.']);
        }

        return [$invoice, $amount];
    }

    /** @return array<string, mixed> */
    private function base(User $actor, Booking $booking, Invoice $invoice, int $amount): array
    {
        return [
            'booking_id' => $booking->id, 'invoice_id' => $invoice->id, 'dealer_id' => $booking->dealer_id,
            'customer_id' => $booking->customer_id, 'initiated_by' => $actor->id, 'amount' => $amount,
            'status' => OnlinePayment::PENDING, // set here too: the column default isn't on the new model
        ];
    }

    private function expireStale(Booking $booking): void
    {
        $booking->onlinePayments()->pending()->get()->each(fn (OnlinePayment $p) => $this->refresh($p, force: true));
    }

    public static function maskPhone(?string $phone): string
    {
        return $phone ? substr($phone, 0, -6).'***'.substr($phone, -3) : '';
    }
}

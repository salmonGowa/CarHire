<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Test card checkout · DriveFleet</title>
    <style>
        :root { --bg: #f1f5f9; --card: #fff; --text: #0f172a; --muted: #64748b; --line: #e2e8f0; --field: #f8fafc; --accent: #2563eb; --warn-bg: #fffbeb; --warn: #b45309; }
        @media (prefers-color-scheme: dark) { :root { --bg: #020617; --card: #0b1120; --text: #f1f5f9; --muted: #94a3b8; --line: #1e293b; --field: #0f172a; --warn-bg: #451a0333; --warn: #fbbf24; } }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
        main { width: 100%; max-width: 420px; background: var(--card); border: 1px solid var(--line); border-radius: 24px; padding: 28px; box-shadow: 0 20px 50px -20px #0f172a40; }
        .badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--warn); background: var(--warn-bg); padding: 4px 10px; border-radius: 999px; }
        h1 { font-size: 20px; margin: 14px 0 2px; }
        .muted { color: var(--muted); font-size: 13px; margin: 0; }
        .amount { font-size: 34px; font-weight: 900; margin: 18px 0; letter-spacing: -.02em; }
        label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin: 12px 0 6px; }
        .field { width: 100%; height: 44px; padding: 0 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--field); color: var(--text); font: inherit; font-family: ui-monospace, monospace; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .actions { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-top: 24px; }
        button { height: 46px; border-radius: 12px; border: 1px solid var(--line); font: inherit; font-weight: 700; cursor: pointer; background: var(--card); color: var(--text); }
        button.pay { background: var(--accent); border-color: var(--accent); color: #fff; }
        button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
        p.note { font-size: 12px; color: var(--muted); text-align: center; margin: 16px 0 0; }
    </style>
</head>
<body>
<main>
    <span class="badge">Test checkout · no money moves</span>
    <h1>Pay {{ $payment->booking->reference }}</h1>
    <p class="muted">DriveFleet is in card simulation mode (CARD_DRIVER=simulate). With Paystack connected, this is Paystack's own page.</p>
    <div class="amount">KSh {{ number_format($payment->amount) }}</div>
    <label for="card">Card number</label>
    <input id="card" class="field" value="4084 0840 8408 4081" readonly>
    <div class="row">
        <div><label for="exp">Expiry</label><input id="exp" class="field" value="12 / 30" readonly></div>
        <div><label for="cvv">CVV</label><input id="cvv" class="field" value="408" readonly></div>
    </div>
    <form method="post" action="{{ route('payments.card.simulate.decide', $payment->reference) }}" class="actions">
        @csrf
        <button type="submit" name="decision" value="decline">Decline</button>
        <button type="submit" name="decision" value="pay" class="pay">Pay KSh {{ number_format($payment->amount) }}</button>
    </form>
    <p class="note">Reference {{ $payment->reference }}</p>
</main>
</body>
</html>

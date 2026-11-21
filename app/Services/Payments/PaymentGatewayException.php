<?php

namespace App\Services\Payments;

use RuntimeException;

/** The payment provider refused a request or couldn't be reached. The message is safe to show staff. */
class PaymentGatewayException extends RuntimeException {}

<?php

return [
    /*
    | Share of each payment's pre-VAT amount the platform keeps as its fee.
    */
    'commission_rate' => (float) env('PLATFORM_COMMISSION_RATE', 0.10),

    /*
    | VAT rate included in booking totals (Kenya standard rate).
    */
    'vat_rate' => 0.16,
];

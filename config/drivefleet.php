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

    /*
    | Dealer subscriptions are billed on the 1st of each month and fall
    | overdue this many days later.
    */
    'subscription_due_days' => (int) env('SUBSCRIPTION_DUE_DAYS', 7),

    /*
    | Browser key for Google Maps (Live Tracking). Only checked for presence
    | on the admin Integrations page.
    */
    'google_maps_key_set' => filled(env('VITE_GOOGLE_MAPS_API_KEY')),
];

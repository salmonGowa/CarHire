<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Text messages: 'log' writes them to the log; 'africastalking' sends them.
    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'),
    ],

    'africastalking' => [
        'username' => env('AFRICASTALKING_USERNAME'),
        'api_key' => env('AFRICASTALKING_API_KEY'),
        'sender_id' => env('AFRICASTALKING_SENDER_ID'),
    ],

    // Online payments. 'simulate' fakes the provider locally (no money moves);
    // 'daraja' / 'paystack' talk to the real services.
    'mpesa' => [
        'driver' => env('MPESA_DRIVER', 'simulate'),
        'environment' => env('MPESA_ENVIRONMENT', 'sandbox'), // sandbox | production
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_SHORTCODE'),
        // Till numbers (Buy Goods) collect to a different number than the store shortcode.
        'till_number' => env('MPESA_TILL_NUMBER'),
        'passkey' => env('MPESA_PASSKEY'),
        'transaction_type' => env('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'),
        // Part of the callback URL, so only Safaricom (who we give it to) can post results.
        'callback_token' => env('MPESA_CALLBACK_TOKEN'),
        'callback_url' => env('MPESA_CALLBACK_URL'), // defaults to APP_URL/webhooks/mpesa/{token}
    ],

    'card' => [
        'driver' => env('CARD_DRIVER', 'simulate'),
    ],

    'paystack' => [
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'currency' => env('PAYSTACK_CURRENCY', 'KES'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];

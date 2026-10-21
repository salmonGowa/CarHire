<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" type="image/png" href="/logo.png">
        <title>{{ config('app.name', 'DriveFleet') }}</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body>
        <div id="root"></div>
        @php
            $appConfig = [
                'user' => auth()->user()?->toFrontend(),
                'showDemoAccounts' => app()->isLocal(),
                'platform' => \App\Support\Settings::public(),
            ];
        @endphp
        <script id="app-config" type="application/json">@json($appConfig)</script>
    </body>
</html>

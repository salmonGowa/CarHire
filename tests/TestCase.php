<?php

namespace Tests;

use App\Support\Settings;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Settings are memoised per process; start every test from the defaults.
        Settings::flush();
        // Pages render the Vite tags; tests mustn't depend on a frontend build existing.
        $this->withoutVite();
    }
}

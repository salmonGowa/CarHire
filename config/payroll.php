<?php

/*
| Kenyan statutory payroll settings.
|
| These reflect the rates in force during 2025 (SHIF replaced NHIF in Oct 2024;
| NSSF "year 3" limits from Feb 2025; SHIF and the Housing Levy deductible
| before PAYE since Dec 2024). Statutory rates change: have an accountant
| confirm every value here before running a real payroll.
*/

return [
    'paye_bands' => [
        // [upper limit of the band (monthly taxable pay), rate]; null = no limit
        [24000, 0.10],
        [32333, 0.25],
        [500000, 0.30],
        [800000, 0.325],
        [null, 0.35],
    ],
    'personal_relief' => 2400,

    'nssf' => [
        'rate' => 0.06,           // employee share; employer matches
        'lower_limit' => 8000,    // Tier I applies up to here
        'upper_limit' => 72000,   // Tier II applies between the limits
    ],

    'shif' => [
        'rate' => 0.0275,
        'minimum' => 300,
    ],

    'housing_levy' => [
        'rate' => 0.015,          // employee share; employer matches
    ],

    // Attendance and leave
    'work_starts_at' => '08:00',
    'late_after_minutes' => 15,
    'annual_leave_days' => 21,
];

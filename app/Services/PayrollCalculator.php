<?php

namespace App\Services;

/**
 * Kenyan monthly payroll deductions, driven by config/payroll.php.
 * All amounts are whole shillings.
 */
class PayrollCalculator
{
    /**
     * @return array{gross: int, nssf: int, shif: int, housing_levy: int, taxable_pay: int, paye: int, net: int, employer_nssf: int, employer_housing_levy: int}
     */
    public function calculate(int $gross): array
    {
        $nssf = $this->nssf($gross);
        $shif = $gross > 0 ? max((int) config('payroll.shif.minimum'), (int) round($gross * (float) config('payroll.shif.rate'))) : 0;
        $housing = (int) round($gross * (float) config('payroll.housing_levy.rate'));

        // NSSF, SHIF and the Housing Levy are allowable deductions before PAYE.
        $taxable = max(0, $gross - $nssf - $shif - $housing);
        $paye = max(0, $this->taxOn($taxable) - (int) config('payroll.personal_relief'));

        return [
            'gross' => $gross,
            'nssf' => $nssf,
            'shif' => $shif,
            'housing_levy' => $housing,
            'taxable_pay' => $taxable,
            'paye' => $paye,
            'net' => $gross - $nssf - $shif - $housing - $paye,
            'employer_nssf' => $nssf,
            'employer_housing_levy' => $housing,
        ];
    }

    private function nssf(int $gross): int
    {
        $rate = (float) config('payroll.nssf.rate');
        $pensionable = min($gross, (int) config('payroll.nssf.upper_limit'));

        return (int) round($pensionable * $rate);
    }

    private function taxOn(int $taxable): int
    {
        $tax = 0.0;
        $lower = 0;
        foreach (config('payroll.paye_bands') as [$upper, $rate]) {
            if ($taxable <= $lower) {
                break;
            }
            $slice = ($upper === null ? $taxable : min($taxable, $upper)) - $lower;
            $tax += $slice * $rate;
            if ($upper === null) {
                break;
            }
            $lower = $upper;
        }

        return (int) round($tax);
    }
}

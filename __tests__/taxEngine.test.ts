import { describe, it, expect } from 'vitest';
import {
  calculateTax,
  calculatePersonalAllowance,
  calculateIncomeTax,
  calculateNIClass2,
  calculateNIClass4,
  calculateNI,
  TAX_YEARS,
  type TaxYearConfig,
} from '../lib/tax-engine';

const config: TaxYearConfig = TAX_YEARS['2026/27'];

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Personal Allowance ─────────────────────────────────

describe('Personal Allowance', () => {
  it('grants standard £12,570 for income up to £100,000', () => {
    expect(calculatePersonalAllowance(0, config)).toBe(12_570);
    expect(calculatePersonalAllowance(50_000, config)).toBe(12_570);
    expect(calculatePersonalAllowance(100_000, config)).toBe(12_570);
  });

  it('tapers £1 for every £2 above £100,000', () => {
    // £102,000 income: reduction = floor(2000/2) = 1000
    expect(calculatePersonalAllowance(102_000, config)).toBe(12_570 - 1_000);
    // £110,000 income: reduction = floor(10000/2) = 5000
    expect(calculatePersonalAllowance(110_000, config)).toBe(12_570 - 5_000);
  });

  it('reduces to £0 at £125,140 and above', () => {
    expect(calculatePersonalAllowance(125_140, config)).toBe(0);
    expect(calculatePersonalAllowance(150_000, config)).toBe(0);
    expect(calculatePersonalAllowance(500_000, config)).toBe(0);
  });

  it('returns full allowance for zero income', () => {
    expect(calculatePersonalAllowance(0, config)).toBe(12_570);
  });
});

// ─── Income Tax Bands ───────────────────────────────────

describe('Income Tax Bands', () => {
  it('returns all zeros for zero taxable income', () => {
    const result = calculateIncomeTax(0, config);
    expect(result).toEqual({ basicRate: 0, higherRate: 0, additionalRate: 0, total: 0 });
  });

  it('returns all zeros for negative taxable income', () => {
    const result = calculateIncomeTax(-5000, config);
    expect(result).toEqual({ basicRate: 0, higherRate: 0, additionalRate: 0, total: 0 });
  });

  it('calculates basic rate (20%) correctly', () => {
    // £10,000 taxable income, all in basic rate band
    const result = calculateIncomeTax(10_000, config);
    expect(result.basicRate).toBe(2_000);
    expect(result.higherRate).toBe(0);
    expect(result.additionalRate).toBe(0);
    expect(result.total).toBe(2_000);
  });

  it('calculates basic + higher rate (40%) correctly', () => {
    // Basic band: 50270 - 12570 = 37700
    const basicBand = 37_700;
    const taxableIncome = 45_000; // 37700 in basic + 7300 in higher
    const result = calculateIncomeTax(taxableIncome, config);
    expect(result.basicRate).toBe(round(basicBand * 0.20));
    expect(result.higherRate).toBe(round((taxableIncome - basicBand) * 0.40));
    expect(result.additionalRate).toBe(0);
    expect(result.total).toBe(round(result.basicRate + result.higherRate));
  });

  it('calculates all three bands (20%/40%/45%) for very high income', () => {
    // Taxable income = £200,000 (PA already removed)
    const basicBand = 37_700;
    const higherBand = 125_140 - 50_270; // 74,870
    const additionalAmount = 200_000 - basicBand - higherBand;
    const result = calculateIncomeTax(200_000, config);

    expect(result.basicRate).toBe(round(basicBand * 0.20));
    expect(result.higherRate).toBe(round(higherBand * 0.40));
    expect(result.additionalRate).toBe(round(additionalAmount * 0.45));
    expect(result.total).toBe(round(result.basicRate + result.higherRate + result.additionalRate));
  });

  it('handles income exactly at basic rate threshold boundary', () => {
    // Basic band width = 50270 - 12570 = 37700 -- exactly fills basic band
    const result = calculateIncomeTax(37_700, config);
    expect(result.basicRate).toBe(round(37_700 * 0.20));
    expect(result.higherRate).toBe(0);
    expect(result.total).toBe(round(37_700 * 0.20));
  });
});

// ─── National Insurance Class 2 ─────────────────────────

describe('National Insurance Class 2', () => {
  it('returns £0 below small profits threshold (£6,725)', () => {
    expect(calculateNIClass2(0, config)).toBe(0);
    expect(calculateNIClass2(6_724, config)).toBe(0);
  });

  it('charges £3.45/week (52 weeks) at or above threshold', () => {
    const expectedAnnual = round(3.45 * 52);
    expect(calculateNIClass2(6_725, config)).toBe(expectedAnnual);
    expect(calculateNIClass2(100_000, config)).toBe(expectedAnnual);
  });

  it('is the same flat rate regardless of profit level', () => {
    const low = calculateNIClass2(10_000, config);
    const high = calculateNIClass2(500_000, config);
    expect(low).toBe(high);
  });
});

// ─── National Insurance Class 4 ─────────────────────────

describe('National Insurance Class 4', () => {
  it('returns £0 at or below lower limit (£12,570)', () => {
    expect(calculateNIClass4(0, config)).toBe(0);
    expect(calculateNIClass4(12_570, config)).toBe(0);
  });

  it('charges 6% on profits between £12,570 and £50,270 (2026/27 rate)', () => {
    const profit = 30_000;
    const expected = round((profit - 12_570) * 0.06);
    expect(calculateNIClass4(profit, config)).toBe(expected);
  });

  it('charges 2% on profits above £50,270', () => {
    const profit = 80_000;
    const mainBand = round((50_270 - 12_570) * 0.06);
    const upperBand = round((80_000 - 50_270) * 0.02);
    expect(calculateNIClass4(profit, config)).toBe(round(mainBand + upperBand));
  });

  it('handles profit exactly at upper limit', () => {
    const profit = 50_270;
    const expected = round((50_270 - 12_570) * 0.06);
    expect(calculateNIClass4(profit, config)).toBe(expected);
  });
});

// ─── Combined NI ────────────────────────────────────────

describe('calculateNI (combined)', () => {
  it('returns combined class2 + class4 total', () => {
    const result = calculateNI(30_000, config);
    expect(result.total).toBe(round(result.class2 + result.class4));
  });

  it('returns zero for zero profit', () => {
    const result = calculateNI(0, config);
    expect(result.class2).toBe(0);
    expect(result.class4).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── Edge Cases via calculateTax ────────────────────────

describe('Tax calculation edge cases', () => {
  it('zero income results in zero tax', () => {
    const result = calculateTax({ totalIncome: 0, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.netProfit).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('expenses exceeding income results in zero profit and zero tax', () => {
    const result = calculateTax({ totalIncome: 10_000, totalExpenses: 15_000, taxYear: '2026/27' });
    expect(result.netProfit).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
  });

  it('income exactly at personal allowance has zero income tax but may have NI', () => {
    const result = calculateTax({ totalIncome: 12_570, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.incomeTax.total).toBe(0);
    // Class 2 applies since 12570 > 6725
    expect(result.nationalInsurance.class2).toBeGreaterThan(0);
    // Class 4: profit at lower limit, so 0
    expect(result.nationalInsurance.class4).toBe(0);
  });

  it('very high income (£500,000) correctly calculates all bands + tapered PA', () => {
    const result = calculateTax({ totalIncome: 500_000, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.personalAllowance).toBe(0);
    expect(result.taxableIncome).toBe(500_000);
    expect(result.incomeTax.basicRate).toBeGreaterThan(0);
    expect(result.incomeTax.higherRate).toBeGreaterThan(0);
    expect(result.incomeTax.additionalRate).toBeGreaterThan(0);
    expect(result.totalTaxOwed).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeGreaterThan(0);
  });

  it('income exactly at basic rate threshold (£50,270)', () => {
    const result = calculateTax({ totalIncome: 50_270, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(37_700);
    // All in basic band
    expect(result.incomeTax.basicRate).toBe(round(37_700 * 0.20));
    expect(result.incomeTax.higherRate).toBe(0);
  });

  it('income exactly at higher rate threshold (£125,140)', () => {
    const result = calculateTax({ totalIncome: 125_140, totalExpenses: 0, taxYear: '2026/27' });
    // PA is fully tapered at 125,140
    expect(result.personalAllowance).toBe(0);
    expect(result.taxableIncome).toBe(125_140);
    // With PA=0, taxable=125140 exceeds the basic+higher bands (37700+74870=112570)
    // so there IS additional rate tax on the remaining 12,570
    expect(result.incomeTax.basicRate).toBeGreaterThan(0);
    expect(result.incomeTax.higherRate).toBeGreaterThan(0);
    expect(result.incomeTax.additionalRate).toBeGreaterThan(0);
  });

  it('setAsideMonthly is totalTaxOwed / 12 for a full year', () => {
    const result = calculateTax({ totalIncome: 30_000, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.setAsideMonthly).toBe(round(result.totalTaxOwed / 12));
  });
});

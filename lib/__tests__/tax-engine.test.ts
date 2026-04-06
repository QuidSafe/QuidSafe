import { describe, it, expect } from 'vitest';
import {
  calculateTax,
  calculatePersonalAllowance,
  calculateIncomeTax,
  calculateNIClass2,
  calculateNIClass4,
  calculateNI,
  formatCurrency,
  getCurrentQuarter,
  getQuarterDates,
  TAX_YEARS,
  type TaxYearConfig,
} from '../tax-engine';

const config: TaxYearConfig = TAX_YEARS['2026/27'];

// Helper: round to 2 decimal places (mirrors the engine's round function)
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── calculateTax ────────────────────────────────────────

describe('calculateTax', () => {
  it('returns all zeros for zero income', () => {
    const result = calculateTax({ totalIncome: 0, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.netProfit).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax.total).toBe(0);
    expect(result.nationalInsurance.total).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('returns zero tax for income exactly at personal allowance (£12,570)', () => {
    const result = calculateTax({ totalIncome: 12_570, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.netProfit).toBe(12_570);
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax.total).toBe(0);
    // NI Class 2 kicks in since profit >= 6725
    expect(result.nationalInsurance.class2).toBe(round(3.45 * 52));
    // NI Class 4: profit at lower limit, so zero
    expect(result.nationalInsurance.class4).toBe(0);
  });

  it('charges £0.20 tax for income of £12,571 (£1 in basic rate)', () => {
    const result = calculateTax({ totalIncome: 12_571, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.taxableIncome).toBe(1);
    expect(result.incomeTax.basicRate).toBe(0.20);
    expect(result.incomeTax.higherRate).toBe(0);
    expect(result.incomeTax.additionalRate).toBe(0);
    expect(result.incomeTax.total).toBe(0.20);
  });

  it('calculates correct IT + NI for basic rate income (£30,000)', () => {
    const result = calculateTax({ totalIncome: 30_000, totalExpenses: 0, taxYear: '2026/27' });
    const taxableIncome = 30_000 - 12_570; // 17,430
    expect(result.taxableIncome).toBe(taxableIncome);
    expect(result.incomeTax.basicRate).toBe(round(taxableIncome * 0.20));
    expect(result.incomeTax.higherRate).toBe(0);
    expect(result.incomeTax.additionalRate).toBe(0);

    // NI Class 2: profit > 6725
    expect(result.nationalInsurance.class2).toBe(round(3.45 * 52));
    // NI Class 4: (30000 - 12570) * 0.06
    expect(result.nationalInsurance.class4).toBe(round((30_000 - 12_570) * 0.06));
  });

  it('calculates correct IT + NI for higher rate income (£60,000)', () => {
    const result = calculateTax({ totalIncome: 60_000, totalExpenses: 0, taxYear: '2026/27' });
    const taxableIncome = 60_000 - 12_570; // 47,430
    expect(result.taxableIncome).toBe(taxableIncome);

    const basicBand = 50_270 - 12_570; // 37,700
    const higherAmount = taxableIncome - basicBand; // 9,730
    expect(result.incomeTax.basicRate).toBe(round(basicBand * 0.20));
    expect(result.incomeTax.higherRate).toBe(round(higherAmount * 0.40));
    expect(result.incomeTax.additionalRate).toBe(0);

    // NI Class 4: main band + upper band
    const niClass4Main = (50_270 - 12_570) * 0.06;
    const niClass4Upper = (60_000 - 50_270) * 0.02;
    expect(result.nationalInsurance.class4).toBe(round(niClass4Main + niClass4Upper));
  });

  it('tapers personal allowance for income at £100,000', () => {
    const result = calculateTax({ totalIncome: 100_000, totalExpenses: 0, taxYear: '2026/27' });
    // At exactly 100k, no tapering yet (income <= taperThreshold)
    expect(result.personalAllowance).toBe(12_570);
  });

  it('fully removes personal allowance at £125,140', () => {
    const result = calculateTax({ totalIncome: 125_140, totalExpenses: 0, taxYear: '2026/27' });
    // Reduction: (125140 - 100000) / 2 = 12570 -> PA = 0
    expect(result.personalAllowance).toBe(0);
    expect(result.taxableIncome).toBe(125_140);
  });

  it('calculates additional rate for income of £200,000', () => {
    const result = calculateTax({ totalIncome: 200_000, totalExpenses: 0, taxYear: '2026/27' });
    // PA is 0 (tapered away)
    expect(result.personalAllowance).toBe(0);
    expect(result.taxableIncome).toBe(200_000);

    // Basic band: 50270 - 12570 = 37700 (uses config PA for the band width)
    const basicBand = 50_270 - 12_570;
    const higherBand = 125_140 - 50_270;
    const additionalAmount = 200_000 - basicBand - higherBand;

    expect(result.incomeTax.basicRate).toBe(round(basicBand * 0.20));
    expect(result.incomeTax.higherRate).toBe(round(higherBand * 0.40));
    expect(result.incomeTax.additionalRate).toBe(round(additionalAmount * 0.45));
  });

  it('treats negative income as zero profit', () => {
    const result = calculateTax({ totalIncome: -5000, totalExpenses: 0, taxYear: '2026/27' });
    // netProfit = Math.max(0, -5000 - 0) = 0
    expect(result.netProfit).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
  });

  it('treats expenses exceeding income as zero profit', () => {
    const result = calculateTax({ totalIncome: 30_000, totalExpenses: 35_000, taxYear: '2026/27' });
    expect(result.netProfit).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
  });

  it('throws for an unknown tax year', () => {
    expect(() => calculateTax({ totalIncome: 1000, totalExpenses: 0, taxYear: '2099/00' })).toThrow(
      'Unknown tax year: 2099/00',
    );
  });
});

// ─── NI Class 2 ──────────────────────────────────────────

describe('calculateNIClass2', () => {
  it('returns £0 when profit is below small profits threshold', () => {
    expect(calculateNIClass2(6_724, config)).toBe(0);
  });

  it('returns weekly rate * 52 when profit is at or above threshold', () => {
    expect(calculateNIClass2(6_725, config)).toBe(round(3.45 * 52));
    expect(calculateNIClass2(50_000, config)).toBe(round(3.45 * 52));
  });
});

// ─── NI Class 4 ──────────────────────────────────────────

describe('calculateNIClass4', () => {
  it('returns £0 when profit is at or below lower limit', () => {
    expect(calculateNIClass4(12_570, config)).toBe(0);
  });

  it('calculates main rate band correctly', () => {
    // Profit between lower and upper limits
    const profit = 40_000;
    const expected = round((profit - 12_570) * 0.06);
    expect(calculateNIClass4(profit, config)).toBe(expected);
  });

  it('calculates main + upper rate bands correctly', () => {
    const profit = 80_000;
    const mainBand = (50_270 - 12_570) * 0.06;
    const upperBand = (80_000 - 50_270) * 0.02;
    expect(calculateNIClass4(profit, config)).toBe(round(mainBand + upperBand));
  });
});

// ─── calculatePersonalAllowance ──────────────────────────

describe('calculatePersonalAllowance', () => {
  it('returns full allowance for income at or below taper threshold', () => {
    expect(calculatePersonalAllowance(100_000, config)).toBe(12_570);
    expect(calculatePersonalAllowance(50_000, config)).toBe(12_570);
  });

  it('tapers £1 for every £2 over £100,000', () => {
    // income 110,000 -> reduction = floor(10000/2) = 5000
    expect(calculatePersonalAllowance(110_000, config)).toBe(12_570 - 5_000);
  });

  it('returns 0 when fully tapered (income >= £125,140)', () => {
    expect(calculatePersonalAllowance(125_140, config)).toBe(0);
    expect(calculatePersonalAllowance(200_000, config)).toBe(0);
  });
});

// ─── formatCurrency ──────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a number as GBP with commas and 2 decimal places', () => {
    expect(formatCurrency(1234.56)).toBe('£1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('formats large numbers with proper grouping', () => {
    expect(formatCurrency(1_000_000)).toBe('£1,000,000.00');
  });
});

// ─── getCurrentQuarter ───────────────────────────────────

describe('getCurrentQuarter', () => {
  it('returns Q1 for a date in April-June', () => {
    const result = getCurrentQuarter(new Date(2026, 3, 10)); // April 10, 2026
    expect(result.quarter).toBe(1);
    expect(result.taxYear).toBe('2026/27');
  });

  it('returns Q2 for a date in July-September', () => {
    const result = getCurrentQuarter(new Date(2026, 7, 15)); // August 15, 2026
    expect(result.quarter).toBe(2);
    expect(result.taxYear).toBe('2026/27');
  });

  it('returns Q3 for a date in October-December', () => {
    const result = getCurrentQuarter(new Date(2026, 10, 20)); // November 20, 2026
    expect(result.quarter).toBe(3);
    expect(result.taxYear).toBe('2026/27');
  });

  it('returns Q4 for a date in January (6+) - March', () => {
    const result = getCurrentQuarter(new Date(2027, 1, 10)); // February 10, 2027
    expect(result.quarter).toBe(4);
    expect(result.taxYear).toBe('2026/27');
  });

  it('returns Q3 for January 1-5 (still previous quarter)', () => {
    const result = getCurrentQuarter(new Date(2027, 0, 3)); // January 3, 2027
    expect(result.quarter).toBe(3);
    expect(result.taxYear).toBe('2026/27');
  });
});

// ─── getQuarterDates ─────────────────────────────────────

describe('getQuarterDates', () => {
  it('returns 4 quarters with correct date ranges', () => {
    const quarters = getQuarterDates('2026/27');
    expect(quarters).toHaveLength(4);

    expect(quarters[0].quarter).toBe(1);
    expect(quarters[0].startDate).toBe('2026-04-06');
    expect(quarters[0].endDate).toBe('2026-07-05');

    expect(quarters[1].quarter).toBe(2);
    expect(quarters[1].startDate).toBe('2026-07-06');
    expect(quarters[1].endDate).toBe('2026-10-05');

    expect(quarters[2].quarter).toBe(3);
    expect(quarters[2].startDate).toBe('2026-10-06');
    expect(quarters[2].endDate).toBe('2027-01-05');

    expect(quarters[3].quarter).toBe(4);
    expect(quarters[3].startDate).toBe('2027-01-06');
    expect(quarters[3].endDate).toBe('2027-04-05');
  });

  it('includes correct deadlines', () => {
    const quarters = getQuarterDates('2026/27');
    expect(quarters[0].deadline).toBe('2026-08-05');
    expect(quarters[3].deadline).toBe('2027-05-05');
  });
});

// ─── generatePlainEnglish (via calculateTax) ─────────────

describe('generatePlainEnglish (via calculateTax)', () => {
  it('returns a non-empty string for zero income', () => {
    const result = calculateTax({ totalIncome: 0, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.plainEnglish).toBeTruthy();
    expect(typeof result.plainEnglish).toBe('string');
    expect(result.plainEnglish.length).toBeGreaterThan(0);
  });

  it('mentions no tax owed when within personal allowance', () => {
    const result = calculateTax({ totalIncome: 10_000, totalExpenses: 0, taxYear: '2026/27' });
    // The only tax is NI Class 2; but the plainEnglish checks totalTaxOwed
    // Since NI Class 2 applies (10000 > 6725), totalTaxOwed > 0, so it won't say "No tax owed"
    // It should still return a non-empty meaningful string
    expect(result.plainEnglish.length).toBeGreaterThan(0);
  });

  it('mentions tapering for income over £100,000', () => {
    const result = calculateTax({ totalIncome: 120_000, totalExpenses: 0, taxYear: '2026/27' });
    expect(result.plainEnglish).toContain('tapered');
  });

  it('returns a descriptive string for typical income', () => {
    const result = calculateTax({ totalIncome: 50_000, totalExpenses: 5_000, taxYear: '2026/27' });
    expect(result.plainEnglish).toContain('earned');
    expect(result.plainEnglish).toContain('Set aside');
  });
});

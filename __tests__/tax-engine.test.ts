import { describe, it, expect } from 'vitest';
import {
  calculatePersonalAllowance,
  calculateIncomeTax,
  calculateNIClass2,
  calculateNIClass4,
  calculateNI,
  calculateTax,
  calculateIncomeTaxFromGross,
  calculateNationalInsurance,
  calculateTotalTax,
  formatCurrency,
  TAX_YEARS,
} from '../lib/tax-engine';

const config = TAX_YEARS['2025/26'];

// ─── Personal Allowance ──────────────────────────────────

describe('calculatePersonalAllowance', () => {
  it('returns full PA for income at or below £100,000', () => {
    expect(calculatePersonalAllowance(0, config)).toBe(12_570);
    expect(calculatePersonalAllowance(50_000, config)).toBe(12_570);
    expect(calculatePersonalAllowance(100_000, config)).toBe(12_570);
  });

  it('tapers by £1 for every £2 above £100,000', () => {
    // £100,002 → reduce by floor(2/2) = 1
    expect(calculatePersonalAllowance(100_002, config)).toBe(12_569);
    // £110,000 → reduce by floor(10000/2) = 5000
    expect(calculatePersonalAllowance(110_000, config)).toBe(7_570);
  });

  it('eliminates PA at exactly £125,140', () => {
    // £125,140 → reduce by floor(25140/2) = 12570
    expect(calculatePersonalAllowance(125_140, config)).toBe(0);
  });

  it('returns 0 PA above £125,140', () => {
    expect(calculatePersonalAllowance(130_000, config)).toBe(0);
    expect(calculatePersonalAllowance(200_000, config)).toBe(0);
  });

  it('handles odd amount above £100k (£1 over → no reduction due to floor)', () => {
    // £100,001 → floor(1/2) = 0 → PA still 12570
    expect(calculatePersonalAllowance(100_001, config)).toBe(12_570);
  });
});

// ─── Income Tax ──────────────────────────────────────────

describe('calculateIncomeTax', () => {
  it('returns zero tax for zero taxable income', () => {
    const result = calculateIncomeTax(0, config);
    expect(result.total).toBe(0);
    expect(result.basicRate).toBe(0);
    expect(result.higherRate).toBe(0);
    expect(result.additionalRate).toBe(0);
  });

  it('returns zero tax for negative taxable income', () => {
    expect(calculateIncomeTax(-1000, config).total).toBe(0);
  });

  it('calculates basic rate only (income £30,000, PA £12,570)', () => {
    // taxableIncome = £30,000 - £12,570 = £17,430
    const taxable = 17_430;
    const result = calculateIncomeTax(taxable, config, 12_570);
    // basicBand = 50270 - 12570 = 37700 → all fits in basic
    expect(result.basicRate).toBe(3_486); // 17430 * 0.20
    expect(result.higherRate).toBe(0);
    expect(result.additionalRate).toBe(0);
    expect(result.total).toBe(3_486);
  });

  it('calculates basic + higher rate (income £60,000)', () => {
    // taxableIncome = 60000 - 12570 = 47430
    const taxable = 47_430;
    const result = calculateIncomeTax(taxable, config, 12_570);
    // basicBand = 50270 - 12570 = 37700
    // basicTax = 37700 * 0.20 = 7540
    expect(result.basicRate).toBe(7_540);
    // higher = 47430 - 37700 = 9730 * 0.40 = 3892
    expect(result.higherRate).toBe(3_892);
    expect(result.additionalRate).toBe(0);
    expect(result.total).toBe(11_432);
  });

  it('calculates all three bands (income £150,000, PA tapered to 0)', () => {
    // taxableIncome = 150000 (PA = 0)
    const taxable = 150_000;
    const result = calculateIncomeTax(taxable, config, 0);
    // basicBand = 50270 - 0 = 50270
    // basicTax = 50270 * 0.20 = 10054
    expect(result.basicRate).toBe(10_054);
    // higherBand = 125140 - 50270 = 74870
    // higherTax = 74870 * 0.40 = 29948
    expect(result.higherRate).toBe(29_948);
    // additional = 150000 - 50270 - 74870 = 24860 * 0.45 = 11187
    expect(result.additionalRate).toBe(11_187);
    expect(result.total).toBe(51_189);
  });

  it('income exactly at basic rate threshold (£50,270)', () => {
    // taxableIncome = 50270 - 12570 = 37700 - exactly fills basic band
    const taxable = 37_700;
    const result = calculateIncomeTax(taxable, config, 12_570);
    expect(result.basicRate).toBe(7_540);
    expect(result.higherRate).toBe(0);
    expect(result.total).toBe(7_540);
  });

  it('income exactly at higher rate threshold (£125,140)', () => {
    // PA tapered to 0 at £125,140, taxableIncome = 125140
    const taxable = 125_140;
    const result = calculateIncomeTax(taxable, config, 0);
    // basicBand = 50270
    // basicTax = 50270 * 0.20 = 10054
    expect(result.basicRate).toBe(10_054);
    // higherBand = 125140 - 50270 = 74870
    // higherTax = 74870 * 0.40 = 29948
    expect(result.higherRate).toBe(29_948);
    expect(result.additionalRate).toBe(0);
    expect(result.total).toBe(40_002);
  });

  it('handles PA taper correctly - basic band widens', () => {
    // Income £130,000 → PA = 0 → taxableIncome = 130,000
    // basicBand should be 50270 (not 37700)
    const taxable = 130_000;
    const result = calculateIncomeTax(taxable, config, 0);
    // basicTax = 50270 * 0.20 = 10054
    expect(result.basicRate).toBe(10_054);
    // higher = min(130000 - 50270, 74870) = min(79730, 74870) = 74870
    expect(result.higherRate).toBe(29_948);
    // additional = 130000 - 50270 - 74870 = 4860 * 0.45 = 2187
    expect(result.additionalRate).toBe(2_187);
    expect(result.total).toBe(42_189);
  });
});

// ─── Class 2 NI ──────────────────────────────────────────

describe('calculateNIClass2', () => {
  it('returns 0 when profits below threshold (£12,570)', () => {
    expect(calculateNIClass2(0, config)).toBe(0);
    expect(calculateNIClass2(12_569, config)).toBe(0);
  });

  it('returns £3.45 × 52 = £179.40 when profits >= £12,570', () => {
    expect(calculateNIClass2(12_570, config)).toBe(179.40);
    expect(calculateNIClass2(50_000, config)).toBe(179.40);
  });
});

// ─── Class 4 NI ──────────────────────────────────────────

describe('calculateNIClass4', () => {
  it('returns 0 when profits at or below £12,570', () => {
    expect(calculateNIClass4(0, config)).toBe(0);
    expect(calculateNIClass4(12_570, config)).toBe(0);
  });

  it('calculates 6% on profits between £12,570 and £50,270', () => {
    // £30,000 → (30000 - 12570) * 0.06 = 17430 * 0.06 = 1045.80
    expect(calculateNIClass4(30_000, config)).toBe(1_045.80);
  });

  it('calculates max main band at exactly £50,270', () => {
    // (50270 - 12570) * 0.06 = 37700 * 0.06 = 2262
    expect(calculateNIClass4(50_270, config)).toBe(2_262);
  });

  it('adds 2% above £50,270', () => {
    // £80,000 → main: 37700 * 0.06 = 2262, additional: (80000-50270) * 0.02 = 29730 * 0.02 = 594.60
    expect(calculateNIClass4(80_000, config)).toBe(2_856.60);
  });
});

// ─── Combined NI ─────────────────────────────────────────

describe('calculateNI', () => {
  it('returns class2 + class4 combined', () => {
    const ni = calculateNI(30_000, config);
    expect(ni.class2).toBe(179.40);
    expect(ni.class4).toBe(1_045.80);
    expect(ni.total).toBe(1_225.20);
  });

  it('returns 0 for zero profit', () => {
    const ni = calculateNI(0, config);
    expect(ni.class2).toBe(0);
    expect(ni.class4).toBe(0);
    expect(ni.total).toBe(0);
  });
});

// ─── Full Tax Calculation ────────────────────────────────

describe('calculateTax', () => {
  it('returns all zeros for zero income', () => {
    const result = calculateTax({ totalIncome: 0, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.netProfit).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax.total).toBe(0);
    expect(result.nationalInsurance.total).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('no tax when profit within personal allowance', () => {
    const result = calculateTax({ totalIncome: 12_000, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.netProfit).toBe(12_000);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax.total).toBe(0);
    // Still pays NI class 2 since profit < 12570
    expect(result.nationalInsurance.class2).toBe(0);
    expect(result.nationalInsurance.class4).toBe(0);
  });

  it('calculates correctly for income exactly at PA (£12,570)', () => {
    const result = calculateTax({ totalIncome: 12_570, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.netProfit).toBe(12_570);
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax.total).toBe(0);
    // NI class 2 kicks in at exactly £12,570
    expect(result.nationalInsurance.class2).toBe(179.40);
  });

  it('calculates basic rate taxpayer (£30,000 income)', () => {
    const result = calculateTax({ totalIncome: 30_000, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.netProfit).toBe(30_000);
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(17_430);
    expect(result.incomeTax.basicRate).toBe(3_486);
    expect(result.incomeTax.total).toBe(3_486);
    expect(result.nationalInsurance.class2).toBe(179.40);
    expect(result.nationalInsurance.class4).toBe(1_045.80);
  });

  it('calculates higher rate taxpayer (£80,000 income)', () => {
    const result = calculateTax({ totalIncome: 80_000, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.netProfit).toBe(80_000);
    expect(result.personalAllowance).toBe(12_570);
    expect(result.taxableIncome).toBe(67_430);
    // basic: 37700 * 0.20 = 7540
    expect(result.incomeTax.basicRate).toBe(7_540);
    // higher: (67430-37700) * 0.40 = 29730 * 0.40 = 11892
    expect(result.incomeTax.higherRate).toBe(11_892);
    expect(result.incomeTax.additionalRate).toBe(0);
  });

  it('handles PA taper for £110,000 income', () => {
    const result = calculateTax({ totalIncome: 110_000, totalExpenses: 0, taxYear: '2025/26' });
    // PA tapered: 12570 - floor(10000/2) = 12570 - 5000 = 7570
    expect(result.personalAllowance).toBe(7_570);
    expect(result.taxableIncome).toBe(102_430);
  });

  it('handles income above £125,140 (PA eliminated)', () => {
    const result = calculateTax({ totalIncome: 150_000, totalExpenses: 0, taxYear: '2025/26' });
    expect(result.personalAllowance).toBe(0);
    expect(result.taxableIncome).toBe(150_000);
    expect(result.incomeTax.additionalRate).toBeGreaterThan(0);
  });

  it('deducts expenses from income', () => {
    const result = calculateTax({ totalIncome: 50_000, totalExpenses: 10_000, taxYear: '2025/26' });
    expect(result.netProfit).toBe(40_000);
    expect(result.taxableIncome).toBe(40_000 - 12_570);
  });

  it('net profit cannot be negative', () => {
    const result = calculateTax({ totalIncome: 5_000, totalExpenses: 10_000, taxYear: '2025/26' });
    expect(result.netProfit).toBe(0);
    expect(result.totalTaxOwed).toBe(0);
  });
});

// ─── Facade Functions ────────────────────────────────────

describe('calculateIncomeTaxFromGross', () => {
  it('handles PA internally', () => {
    const result = calculateIncomeTaxFromGross(30_000, '2025/26');
    expect(result.basicRate).toBe(3_486);
    expect(result.total).toBe(3_486);
  });

  it('handles PA taper for high earners', () => {
    const result = calculateIncomeTaxFromGross(130_000, '2025/26');
    expect(result.additionalRate).toBeGreaterThan(0);
  });
});

describe('calculateNationalInsurance', () => {
  it('calculates NI from gross profit', () => {
    const result = calculateNationalInsurance(30_000, '2025/26');
    expect(result.class2).toBe(179.40);
    expect(result.class4).toBe(1_045.80);
  });
});

describe('calculateTotalTax', () => {
  it('returns FullTaxResult with all fields', () => {
    const result = calculateTotalTax(50_000, 5_000, '2025/26');
    expect(result.grossIncome).toBe(50_000);
    expect(result.allowableExpenses).toBe(5_000);
    expect(result.netProfit).toBe(45_000);
    expect(result.taxYear).toBe('2025/26');
    expect(result.plainEnglish).toBeTruthy();
  });
});

// ─── formatCurrency ──────────────────────────────────────

describe('formatCurrency', () => {
  it('formats with £ and two decimal places', () => {
    expect(formatCurrency(1234.5)).toBe('£1,234.50');
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(100_000)).toBe('£100,000.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(99.999)).toBe('£100.00');
  });
});

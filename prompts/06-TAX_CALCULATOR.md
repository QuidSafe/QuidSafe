# Prompt 06 — UK Tax Calculation Engine

## Context
The tax engine is a pure TypeScript library in `packages/tax-engine/` that calculates Income Tax and National Insurance for UK sole traders. It must be accurate, tested, and easy to update when HMRC changes rates.

## Task
Build the complete UK sole trader tax calculator.

## Requirements

### 1. Tax Year Configuration
Create a config file `tax-years.ts` with rates for 2025/26 and 2026/27:

```typescript
// 2026/27 rates (verify against HMRC before launch)
{
  year: "2026/27",
  personalAllowance: 12570,
  basicRateThreshold: 50270,
  higherRateThreshold: 125140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  niClass2WeeklyRate: 3.45,
  niClass2SmallProfitsThreshold: 6725,
  niClass4LowerLimit: 12570,
  niClass4UpperLimit: 50270,
  niClass4MainRate: 0.06,
  niClass4AdditionalRate: 0.02,
}
```

### 2. Core Calculation Functions

```typescript
calculateIncomeTax(grossIncome: number, taxYear: string): TaxBreakdown
calculateNationalInsurance(grossProfit: number, taxYear: string): NIBreakdown
calculateTotalTax(grossIncome: number, allowableExpenses: number, taxYear: string): FullTaxResult
calculateSetAsideMonthly(totalTax: number, monthsRemaining: number): number
```

### 3. `FullTaxResult` Type
```typescript
interface FullTaxResult {
  taxYear: string;
  grossIncome: number;
  allowableExpenses: number;
  netProfit: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTax: {
    basicRate: number;
    higherRate: number;
    additionalRate: number;
    total: number;
  };
  nationalInsurance: {
    class2: number;
    class4: number;
    total: number;
  };
  totalTaxOwed: number;
  effectiveRate: number; // as percentage
  setAsideMonthly: number;
  plainEnglish: string; // "You've earned £14,235. Set aside £2,847 for tax."
}
```

### 4. Edge Cases to Handle
- Income below personal allowance → £0 tax
- Income above £100k → personal allowance tapers (£1 for every £2 over £100k)
- Class 2 NI only if profits > small profits threshold
- Class 4 NI calculated on profits between lower and upper limits
- Partial tax year (new sole trader started mid-year)
- Multiple income sources summed correctly

### 5. Plain English Generator
Create a function that converts tax results into friendly messages:
- "You've earned £3,240 this month. Set aside £648 and you're covered."
- "Good news — your income is below the personal allowance. No tax owed yet."
- "Heads up — you're approaching the higher rate threshold."
- "Based on this quarter, you should set aside £X per month."

### 6. Quarterly Breakdown
```typescript
getQuarterlyBreakdown(userId: string, taxYear: string): QuarterlyView
```
Returns income, expenses, and tax for each quarter (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar).

### 7. Tests
Write comprehensive tests using Vitest:
- Zero income → zero tax
- Income = £12,570 → zero tax (exactly personal allowance)
- Income = £30,000 → expected tax breakdown
- Income = £55,000 → basic + higher rate split
- Income = £130,000 → tapered personal allowance
- NI calculations at each threshold
- Monthly set-aside calculations

## Output
Complete tax engine library with types, calculation functions, plain English generator, and 15+ test cases.

---
name: uk-tax-rules
description: UK sole trader tax rules for 2025/26 and 2026/27. Use when working on the tax engine, calculator, or MTD submission code.
---

# UK Tax Rules Skill

## When to Use
- Modifying `lib/tax-engine.ts`
- Working on tax calculation API routes
- Building MTD submission features
- Displaying tax information in the UI

## Tax Year
- Runs 6 April to 5 April
- 2025/26: 6 April 2025 – 5 April 2026
- 2026/27: 6 April 2026 – 5 April 2027

## Income Tax Bands (2025/26)
| Band | Rate | Range |
|------|------|-------|
| Personal Allowance | 0% | £0 – £12,570 |
| Basic Rate | 20% | £12,571 – £50,270 |
| Higher Rate | 40% | £50,271 – £125,140 |
| Additional Rate | 45% | £125,141+ |

Personal allowance tapers by £1 for every £2 over £100,000.

## National Insurance (2025/26)
### Class 2 (flat rate)
- £3.45/week if profits > £12,570
- Voluntary if profits £6,725 – £12,570

### Class 4 (on profits)
| Band | Rate | Range |
|------|------|-------|
| Lower | 0% | £0 – £12,570 |
| Main | 6% | £12,571 – £50,270 |
| Upper | 2% | £50,271+ |

## Making Tax Digital (MTD)
- Mandatory for sole traders earning > £50,000 from April 2026
- > £30,000 from April 2027
- Quarterly updates to HMRC (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar)
- Final declaration replaces Self Assessment

## HMRC Allowable Expenses
| Category | Examples |
|----------|---------|
| Office, property and equipment | Stationery, software, phone, broadband |
| Car, van and travel | Fuel, parking, public transport (business) |
| Clothing | Uniforms, protective clothing only |
| Staff costs | Wages, subcontractor payments |
| Financial costs | Insurance, bank charges |
| Marketing | Ads, website hosting |
| Training | Professional development courses |
| Legal and professional | Accountant, legal fees |

## Key Deadlines
- 31 January  -  Self Assessment + payment deadline
- 31 July  -  Payment on account (2nd instalment)
- Quarterly MTD deadlines: 5 Aug, 5 Nov, 5 Feb, 5 May

## Implementation Notes
- All calculations in `lib/tax-engine.ts` use pure functions
- Currency stored as REAL in D1 (pence precision via rounding)
- Format with `formatCurrency()` → "£1,234.56"
- Tax year detection: if month >= 4 && day >= 6, use current year; otherwise previous

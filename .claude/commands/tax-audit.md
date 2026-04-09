# Tax Audit

Audit the UK tax calculation code against current HMRC 2025/26 rates. Report findings with file:line references.

## Steps

1. **Read tax engine**: Read `lib/tax-engine.ts` fully  -  this is the core tax calculation logic.

2. **Read categoriser**: Read `worker/services/categoriser.ts`  -  check how income and expenses are categorised and whether categories align with HMRC allowable expenses.

3. **Cross-reference rates**: Verify all hardcoded rates against 2025/26 HMRC rates:

   | Rate | Expected Value |
   |------|---------------|
   | Personal Allowance | £12,570 |
   | Basic rate | 20% (£12,571 – £50,270) |
   | Higher rate | 40% (£50,271 – £125,140) |
   | Additional rate | 45% (above £125,140) |
   | Class 2 NI | £3.45/week |
   | Class 4 NI (lower) | 6% (£12,570 – £50,270) |
   | Class 4 NI (upper) | 2% (above £50,270) |

4. **Check edge cases**:
   - Personal Allowance taper for income over £100,000 (reduces by £1 for every £2 above £100k, reaches £0 at £125,140)
   - Class 4 NI thresholds align with income tax thresholds
   - Zero income produces zero tax (no negative values)
   - Losses handled correctly (carried forward or offset)
   - Tax year boundaries: 6 April – 5 April

5. **MTD quarterly logic**: Verify quarterly deadline calculations:
   - Q1: 6 Apr – 5 Jul → deadline 5 Aug
   - Q2: 6 Jul – 5 Oct → deadline 5 Nov
   - Q3: 6 Oct – 5 Jan → deadline 5 Feb
   - Q4: 6 Jan – 5 Apr → deadline 5 May

6. **Config vs hardcoded**: Flag any rates that are hardcoded and should be config-driven (to make future tax year updates easier).

## Output

Report findings as:
```
Tax Audit Results
=================
[PASS] or [FAIL] Description  -  file:line
...

Recommendations:
- ...
```

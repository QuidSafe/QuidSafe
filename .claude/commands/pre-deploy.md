# Pre-Deploy Checklist

Run the full pre-deploy checklist before any production deployment. Report PASS/FAIL for each step.

## Steps

1. **TypeScript check (app)**: Run `npx tsc --noEmit` and report any errors.
2. **TypeScript check (worker)**: Run `npx tsc --noEmit -p tsconfig.worker.json` and report any errors.
3. **Lint**: Run `npx eslint "app/**/*.tsx" "lib/**/*.ts" "components/**/*.tsx"` and report any errors.
4. **Tests**: Run `npm run test` (if configured) and report results.
5. **Pending migrations**: Check `worker/migrations/` for any migration files that have not been applied. Compare filenames against what is deployed.
6. **Console.log cleanup**: Scan all files in `worker/` for `console.log` statements. Remove any that are not intentional error logging (`console.error` for genuine errors is OK). Report any found.
7. **Env var coverage**: Read `.env.example` and verify every `EXPO_PUBLIC_*` and worker env var referenced in code has a corresponding entry. Flag any mismatches.
8. **No hardcoded API keys**: Scan the entire codebase for patterns that look like API keys, secret keys, or tokens hardcoded in source files (not in `.env` or wrangler secrets). Flag any found.
9. **Security sign-off**: If this deploy includes changes to any of these files, confirm the `worker-security-reviewer` agent has reviewed them:
   - `worker/middleware/auth.ts`
   - `worker/utils/crypto.ts`
   - `worker/services/stripe.ts`
   - `worker/services/banking.ts`

## Output Format

```
Pre-Deploy Checklist Results
============================
1. TypeScript (app):     PASS / FAIL (N errors)
2. TypeScript (worker):  PASS / FAIL (N errors)
3. Lint:                 PASS / FAIL (N warnings, N errors)
4. Tests:                PASS / FAIL / SKIPPED
5. Pending migrations:   PASS / FAIL (list any unapplied)
6. Console.log cleanup:  PASS / FAIL (N found in worker/)
7. Env var coverage:     PASS / FAIL (list mismatches)
8. Hardcoded secrets:    PASS / FAIL (list any found)
9. Security sign-off:    PASS / FAIL / N/A

Overall: READY TO DEPLOY / BLOCKED (fix N issues)
```

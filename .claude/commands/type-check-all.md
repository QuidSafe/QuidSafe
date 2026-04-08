# Type Check All

Run both TypeScript checks for the QuidSafe project. The app and worker have separate tsconfigs and must not share types.

## Steps

1. **App TypeScript check**: Run `npx tsc --noEmit` and capture all errors.
2. **Worker TypeScript check**: Run `npx tsc --noEmit -p tsconfig.worker.json` and capture all errors.

## Output

Group errors by file and report:
- Total error count for each tsconfig
- Errors grouped by file with line numbers
- Any cross-boundary type imports (worker types imported in `app/`, `lib/`, or `components/` — or app types imported in `worker/`)

## Reminder

The two tsconfigs exist for a reason:
- `tsconfig.json` — Expo app (React Native, JSX, path aliases)
- `tsconfig.worker.json` — Cloudflare Worker (no JSX, Hono, D1 types)

Worker types must NOT bleed into frontend code and vice versa. Flag any imports that cross this boundary.

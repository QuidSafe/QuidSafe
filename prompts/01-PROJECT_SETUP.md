# Prompt 01 — Project Setup & Scaffold

## Context
We're building **QuidSafe** — a UK sole trader tax tracker that runs as a website + iOS + Android app from ONE codebase. The stack is designed for cheapest cost and lowest maintenance:

- **Universal App:** Expo (SDK 52) with React Native Web — single codebase outputs iOS, Android, AND web
- **Backend:** Supabase Edge Functions (Deno/TypeScript) — serverless, zero servers to maintain
- **Database:** Supabase PostgreSQL — managed, auto-backups, Row Level Security
- **Auth:** Supabase Auth — magic link + Google OAuth, 50k MAU free
- **Routing:** Expo Router (file-based routing, works on all platforms)

## Task
Scaffold the full project with Expo, Supabase, and all shared code.

## Requirements

1. Initialise an Expo project with Expo Router (file-based routing):
   ```bash
   npx create-expo-app@latest quidsafe --template tabs
   ```
2. Enable React Native Web for web platform support
3. Create the following file-based routes in `app/`:
   - `(auth)/login.tsx` — Login screen
   - `(auth)/signup.tsx` — Signup screen
   - `(tabs)/_layout.tsx` — Tab navigator (Home, Income, Learn, Settings)
   - `(tabs)/index.tsx` — Dashboard (home tab)
   - `(tabs)/income.tsx` — Income breakdown
   - `(tabs)/learn.tsx` — Tax education articles
   - `(tabs)/settings.tsx` — Settings & preferences
   - `onboarding/index.tsx` — 3-step onboarding flow
4. Set up Supabase:
   - `lib/supabase.ts` — Supabase client initialisation
   - `supabase/` directory for Edge Functions and migrations
   - `.env.local` with Supabase URL + anon key
5. Create shared modules:
   - `lib/tax-engine.ts` — UK tax calculation (pure functions)
   - `lib/types.ts` — All shared TypeScript types
   - `components/` — Reusable UI components (Card, Button, Badge, etc.)
6. Configure:
   - TypeScript strict mode
   - ESLint + Prettier
   - `app.json` / `app.config.ts` for Expo config (name, slug, icons, splash)
   - EAS Build config (`eas.json`) for iOS + Android builds
7. Add a basic health check Edge Function: `supabase/functions/health/index.ts`
8. Web export config for Vercel deployment

## Design System (apply everywhere)
- Font: Manrope (body) + Playfair Display (display) — load via expo-font + Google Fonts
- Primary: #0F4C75 | Secondary: #1B9C85 | Accent: #E8A838
- Border radius: 14px (cards), 10px (inputs), 9999px (pills)
- Soft UI Evolution style — soft shadows, subtle depth, no harsh borders

## Why This Stack
- **£0/mo hosting** until you have paying users
- **ONE codebase** for web + iOS + Android (not 2 separate apps)
- **Zero servers** to patch, scale, or monitor
- **Over-the-air updates** via EAS Update (skip app store review for JS changes)
- **Supabase free tier** covers DB, auth, edge functions, storage, and cron jobs

## Output
The complete file tree, ready to `npx expo start` for all 3 platforms.

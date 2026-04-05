# Development Environment Architecture

## Overview

Minimal local setup — Expo handles web + mobile from one dev server. Supabase CLI provides local database + auth + edge functions. No Docker needed for basic development.

```mermaid
graph TB
    subgraph Developer Machine
        subgraph IDE["VS Code / Cursor + Claude Code"]
            CC["Claude Code<br/>AI Pair Programmer"]
            TS["TypeScript<br/>Strict Mode"]
        end

        subgraph Expo Dev Server
            EXPO["Expo Dev Server<br/>Port 8081<br/>─────────<br/>Web: localhost:8081<br/>iOS: Simulator<br/>Android: Emulator<br/>All from ONE server"]
        end

        subgraph Supabase Local
            PG["Supabase Postgres<br/>Port 54322<br/>─────────<br/>users, transactions,<br/>tax_calculations,<br/>subscriptions"]
            AUTH_L["Supabase Auth<br/>Port 54321<br/>─────────<br/>Magic Link + Google"]
            EDGE["Edge Functions<br/>Port 54321<br/>─────────<br/>Serverless API<br/>Hot Reload"]
        end
    end

    subgraph Sandbox APIs
        TL["TrueLayer Sandbox<br/>─────────<br/>Mock Bank Accounts<br/>No Real Money"]
        HMRC_S["HMRC MTD Sandbox<br/>─────────<br/>Test Submissions"]
        STRIPE_S["Stripe Test Mode<br/>─────────<br/>Test Cards 4242..."]
        CLAUDE["Claude API<br/>─────────<br/>Haiku 4.5<br/>Transaction Categorisation"]
    end

    subgraph Test on All Platforms
        WEB["Web Browser<br/>localhost:8081"]
        IOS["iOS Simulator"]
        AND["Android Emulator"]
        PHYS["Physical Device<br/>Expo Go"]
    end

    CC --> EXPO
    EXPO --> PG
    EXPO --> AUTH_L
    EXPO --> EDGE
    EDGE --> TL
    EDGE --> HMRC_S
    EDGE --> STRIPE_S
    EDGE --> CLAUDE
    EXPO --> WEB
    EXPO --> IOS
    EXPO --> AND
    EXPO --> PHYS
```

## Local Setup (No Docker Required)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialise local Supabase (starts Postgres + Auth + Edge Functions)
supabase init
supabase start
# → Outputs: API URL, DB URL, anon key, service key
```

This single command gives you everything: Postgres, Auth, Edge Functions, Storage, and a local dashboard at `localhost:54323`.

## Environment Variables (.env.local)

```bash
# Supabase (from `supabase start` output)
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...local-anon-key

# TrueLayer Sandbox
TRUELAYER_CLIENT_ID=sandbox-xxx
TRUELAYER_CLIENT_SECRET=sandbox-xxx
TRUELAYER_ENV=sandbox

# HMRC Sandbox
HMRC_CLIENT_ID=sandbox-xxx
HMRC_CLIENT_SECRET=sandbox-xxx
HMRC_ENV=sandbox

# Stripe Test
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Auth
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=xxx

# Email (local Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Dev Workflow

```
1. Start Supabase local:       supabase start
2. Run migrations:             supabase db push
3. Seed test data:             supabase db seed
4. Start Expo (ALL platforms): npx expo start
   → Press 'w' for web
   → Press 'i' for iOS simulator
   → Press 'a' for Android emulator
   → Scan QR for physical device
5. Serve Edge Functions:       supabase functions serve
6. Forward Stripe webhooks:    stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
7. Browse DB:                  open http://localhost:54323 (Supabase Studio)
```

**That's it. 3 commands to run the entire stack on all platforms.**

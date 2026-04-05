# Prompt 03 — Authentication & Onboarding Flow

## Context
QuidSafe uses Supabase Auth for authentication. Users sign up via email magic link or Google OAuth. After auth, they go through a 3-step onboarding before reaching the dashboard.

## Task
Implement the full auth flow in both the API and mobile app.

## Requirements

### API Endpoints (packages/api)
1. `POST /auth/signup` — Create user record after Supabase auth callback
2. `POST /auth/session` — Validate Supabase JWT, return user profile
3. `PUT /auth/onboarding` — Update onboarding progress
4. `DELETE /auth/account` — Delete account + all data (GDPR right to delete)

### Auth Middleware
- Create a Hono middleware that extracts the Supabase JWT from `Authorization: Bearer <token>`
- Verifies the token with Supabase
- Attaches `user_id` to the request context
- Returns 401 if invalid/expired
- Apply to all routes except `/health` and `/auth/signup`

### Mobile Onboarding (apps/mobile)
Build 3 onboarding screens following the QuidSafe design system:

**Screen 1 — Welcome**
- QuidSafe logo + tagline "Tax sorted. Stress gone."
- Brief value props (3 feature rows with icons)
- "Connect my bank" primary CTA
- "I'll explore first" ghost button
- Trust badge: "FCA regulated · Bank-grade encryption · Read-only"

**Screen 2 — Bank Connection**
- Explain Open Banking in plain English
- "Your bank data stays read-only. We can never move money."
- Launch TrueLayer auth link in in-app browser
- Handle success/failure callbacks
- Show connected bank confirmation

**Screen 3 — All Set**
- Success animation
- "We're syncing your transactions now"
- "This usually takes about 30 seconds"
- Auto-navigate to dashboard when first sync completes

### Design Specs
- Use the Soft UI Evolution style from our design system
- SVG icons only (Lucide React Native) — no emojis
- Smooth transitions between screens (slide animation, 300ms)
- Primary: #0F4C75, Secondary: #1B9C85
- Font: Manrope (body), Playfair Display (headings)
- All buttons must have cursor-pointer and active/press states

## Output
Auth middleware, API endpoints, and all 3 onboarding screens as React Native components.

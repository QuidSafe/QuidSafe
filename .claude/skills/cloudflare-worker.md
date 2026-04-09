---
name: cloudflare-worker
description: Cloudflare Workers + D1 + Hono patterns for QuidSafe API. Use when building API routes, database queries, or service integrations.
---

# Cloudflare Worker Skill

## When to Use
- Adding API routes to `worker/index.ts`
- Writing D1 database queries
- Creating new services in `worker/services/`
- Configuring wrangler.toml

## Hono Route Patterns

```typescript
// All routes in worker/index.ts
const app = new Hono<{ Bindings: Env }>();

// Public route
app.get('/health', (c) => c.json({ status: 'ok' }));

// Protected route (with auth middleware)
app.get('/api/dashboard', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  // ...
});
```

## D1 Query Patterns

```typescript
// ALWAYS use prepared statements
const user = await db.prepare('SELECT id, email FROM users WHERE id = ?')
  .bind(userId)
  .first();

// Insert
await db.prepare('INSERT INTO expenses (id, user_id, amount, description, date) VALUES (?, ?, ?, ?, ?)')
  .bind(crypto.randomUUID(), userId, amount, description, date)
  .run();

// Batch operations
await db.batch([
  db.prepare('INSERT INTO ...').bind(...),
  db.prepare('UPDATE ...').bind(...),
]);

// NEVER concatenate user input into SQL
```

## Environment Bindings

```typescript
interface Env {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUELAYER_CLIENT_ID: string;
  TRUELAYER_CLIENT_SECRET: string;
  ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
}
```

## Auth Middleware

```typescript
// worker/middleware/auth.ts verifies Clerk JWT
// Sets c.set('userId', clerkUserId) on success
// Returns 401 on invalid/missing token
```

## Stripe (No SDK)

```typescript
// worker/services/stripe.ts uses raw fetch
const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${stripeSecretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({ ... }).toString(),
});
```

## Encryption

```typescript
// worker/utils/crypto.ts  -  AES-256-GCM
import { encrypt, decrypt } from '../utils/crypto';

const encrypted = await encrypt(plaintext, env.ENCRYPTION_KEY);
const decrypted = await decrypt(encrypted, env.ENCRYPTION_KEY);
```

## Deployment

```bash
npx wrangler dev           # Local development
npx wrangler deploy        # Deploy to production
npx wrangler d1 migrations apply quidsafe-staging --remote
```

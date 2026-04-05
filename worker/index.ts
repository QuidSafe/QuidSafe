import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TRUELAYER_CLIENT_ID: string;
  TRUELAYER_CLIENT_SECRET: string;
  HMRC_CLIENT_ID: string;
  HMRC_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:8081', 'https://quidsafe.co.uk', 'https://app.quidsafe.co.uk'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// ─── Health ───────────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth ─────────────────────────────────────────────────
app.post('/auth/signup', async (c) => {
  // TODO: Validate Clerk JWT, create user row in D1
  return c.json({ message: 'not implemented' }, 501);
});

app.post('/auth/session', async (c) => {
  // TODO: Validate Clerk JWT, return user profile
  return c.json({ message: 'not implemented' }, 501);
});

app.put('/auth/onboarding', async (c) => {
  // TODO: Update onboarding step
  return c.json({ message: 'not implemented' }, 501);
});

app.delete('/auth/account', async (c) => {
  // TODO: GDPR account deletion
  return c.json({ message: 'not implemented' }, 501);
});

// ─── Dashboard ────────────────────────────────────────────
app.get('/dashboard', async (c) => {
  // TODO: Aggregate dashboard data from D1
  return c.json({ message: 'not implemented' }, 501);
});

// ─── Transactions ─────────────────────────────────────────
app.get('/transactions', async (c) => {
  // TODO: List transactions with pagination
  return c.json({ message: 'not implemented' }, 501);
});

app.get('/transactions/uncategorised', async (c) => {
  // TODO: Return transactions needing review
  return c.json({ message: 'not implemented' }, 501);
});

app.put('/transactions/:id/category', async (c) => {
  // TODO: Override AI category
  return c.json({ message: 'not implemented' }, 501);
});

// ─── Tax ──────────────────────────────────────────────────
app.get('/tax/calculation', async (c) => {
  // TODO: Return latest tax calculation from D1
  return c.json({ message: 'not implemented' }, 501);
});

app.get('/tax/quarterly', async (c) => {
  // TODO: Quarter-by-quarter breakdown
  return c.json({ message: 'not implemented' }, 501);
});

// ─── Catch-all 404 ────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

// ─── Global error handler ─────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500,
  );
});

export default app;

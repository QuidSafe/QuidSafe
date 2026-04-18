// Admin setup-checklist knowledge base.
// Single source of truth for what env vars/migrations/services QuidSafe expects.
// Updating infra? Touch this file.

export type SecretKind = 'secret' | 'var';

export interface RequiredEnvVar {
  key: string;
  kind: SecretKind;
  description: string;
  // When true, the setup tab may render the last 4 chars of the value as a
  // confidence check. Set false for values that have no useful tail (hex keys,
  // passwords, anything whose suffix might itself be sensitive).
  previewable: boolean;
}

// Only `var`-kind keys (public by nature) get last-4-chars previews.
// Secret-kind keys never get previews - last 4 chars of a Stripe key helps an
// attacker confirm a specific leaked credential, so the tradeoff isn't worth it.
export const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  { key: 'CLERK_SECRET_KEY',       kind: 'secret', description: 'Clerk backend API key for JWT verification',    previewable: false },
  { key: 'CLERK_PUBLISHABLE_KEY',  kind: 'var',    description: 'Clerk frontend key (baked into JWKS URL)',       previewable: true },
  { key: 'STRIPE_SECRET_KEY',      kind: 'secret', description: 'Stripe API key for checkout + subscriptions',    previewable: false },
  { key: 'STRIPE_WEBHOOK_SECRET',  kind: 'secret', description: 'Stripe webhook signing secret',                  previewable: false },
  { key: 'TRUELAYER_CLIENT_ID',    kind: 'secret', description: 'TrueLayer OAuth client ID',                      previewable: false },
  { key: 'TRUELAYER_CLIENT_SECRET',kind: 'secret', description: 'TrueLayer OAuth client secret',                  previewable: false },
  { key: 'TRUELAYER_REDIRECT_URI', kind: 'var',    description: 'OAuth callback URL registered with TrueLayer',   previewable: true },
  { key: 'HMRC_CLIENT_ID',         kind: 'secret', description: 'HMRC MTD API OAuth client ID',                   previewable: false },
  { key: 'HMRC_CLIENT_SECRET',     kind: 'secret', description: 'HMRC MTD API OAuth client secret',               previewable: false },
  { key: 'ENCRYPTION_KEY',         kind: 'secret', description: 'AES-256-GCM key for bank token encryption',      previewable: false },
  { key: 'ANTHROPIC_API_KEY',      kind: 'secret', description: 'Claude API key for transaction categorisation', previewable: false },
  { key: 'RESEND_API_KEY',         kind: 'secret', description: 'Resend API key for invoice emails',              previewable: false },
  { key: 'FROM_EMAIL',             kind: 'var',    description: 'Sender address used for invoice + system mail',  previewable: true },
  { key: 'APP_URL',                kind: 'var',    description: 'Canonical user-facing URL for this environment', previewable: true },
  { key: 'HEALTH_CHECK_TOKEN',     kind: 'secret', description: 'Bearer token for /health/detailed',              previewable: false },
  { key: 'ADMIN_EMAILS',           kind: 'secret', description: 'Comma-separated allowlist for /admin/* routes',  previewable: false },
  { key: 'SENTRY_DSN',             kind: 'var',    description: 'Optional error reporting endpoint',              previewable: true },
];

// Known migration filenames. A unit test (see __tests__/config.test.ts) asserts
// this matches what's actually in worker/migrations/, so CI fails if you add a
// migration but forget to list it here.
export const MIGRATION_FILES: string[] = [
  '001_initial.sql',
  '002_full_schema.sql',
  '003_notification_preferences.sql',
  '004_grace_period_and_tiers.sql',
  '005_notify_mtd_ready.sql',
  '006_recurring_expenses.sql',
  '007_rate_limits.sql',
  '008_remove_free_tier.sql',
  '009_nino.sql',
  '010_performance_indexes.sql',
  '011_oauth_states.sql',
  '012_articles.sql',
  '013_additional_indexes.sql',
  '014_fix_check_constraints.sql',
  '015_recurring_expenses_index.sql',
  '016_unique_active_provider.sql',
  '017_audit_log.sql',
  '018_mileage_logs.sql',
  '019_invoice_numbers.sql',
  '020_clients.sql',
  '021_admin_access_log.sql',
];

export interface ExternalService {
  name: string;
  dashboardUrl: string;
  // Which env var(s) prove this service is wired up. If every listed key is
  // present, the setup tab marks the service as "configured".
  configuredWhen: string[];
}

export const EXTERNAL_SERVICES: ExternalService[] = [
  { name: 'Clerk',       dashboardUrl: 'https://dashboard.clerk.com',               configuredWhen: ['CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY'] },
  { name: 'Stripe',      dashboardUrl: 'https://dashboard.stripe.com',              configuredWhen: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
  { name: 'Cloudflare',  dashboardUrl: 'https://dash.cloudflare.com',               configuredWhen: [] },
  { name: 'TrueLayer',   dashboardUrl: 'https://console.truelayer.com',             configuredWhen: ['TRUELAYER_CLIENT_ID', 'TRUELAYER_CLIENT_SECRET'] },
  { name: 'HMRC MTD',    dashboardUrl: 'https://developer.service.hmrc.gov.uk',     configuredWhen: ['HMRC_CLIENT_ID', 'HMRC_CLIENT_SECRET'] },
  { name: 'Anthropic',   dashboardUrl: 'https://console.anthropic.com',             configuredWhen: ['ANTHROPIC_API_KEY'] },
  { name: 'Resend',      dashboardUrl: 'https://resend.com',                        configuredWhen: ['RESEND_API_KEY'] },
  { name: 'Sentry',      dashboardUrl: 'https://sentry.io',                         configuredWhen: ['SENTRY_DSN'] },
  { name: 'GitHub Repo', dashboardUrl: 'https://github.com/QuidSafe/QuidSafe',      configuredWhen: [] },
];

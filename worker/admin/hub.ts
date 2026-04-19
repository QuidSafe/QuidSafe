// Admin hub endpoint. One aggregated snapshot of business health -
// "is QuidSafe alive and making money?" in a single JSON payload.
//
// Runs behind adminAuth. Every query is count-only or small-result; no
// per-user data is surfaced (admins who want per-user drill-down use the
// setup page or Cloudflare logs).
//
// Keep this file dumb: D1 queries in, flat JSON out. Derivations (e.g.
// "MRR is healthy if > £X") live in the frontend.

import type { Env } from '../index';

export interface HubKpi {
  label: string;
  value: number;
  unitPrefix?: string;  // '£'
  unitSuffix?: string;  // '%'
}

export interface HubIncident {
  severity: 'critical' | 'warning';
  label: string;
  detail: string;
}

export interface HubFunnelStep {
  label: string;
  count: number;
}

export interface HubJobStatus {
  name: string;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastDurationMs: number | null;
  lastStatus: 'success' | 'failed' | 'running' | null;
  lastError: string | null;
  staleHours: number | null;
}

export interface HubPayload {
  environment: string;
  generatedAt: string;
  // Top strip: business-at-a-glance
  kpis: HubKpi[];
  // Incidents panel (empty = calm day)
  incidents: HubIncident[];
  // Funnel: signup → onboarded → bank-connected → paid
  funnel: HubFunnelStep[];
  // Subscription status breakdown
  subsByStatus: { status: string; count: number }[];
  // Bank connection health
  bankHealth: {
    activeCount: number;
    expiredCount: number;
    neverSyncedCount: number;
    stale24hCount: number;
  };
  // MTD submission health
  mtdHealth: {
    submittedCount: number;
    draftCount: number;
    rejectedCount: number;
  };
  // Background job status
  jobs: HubJobStatus[];
  // Rough monthly opex estimate (static values tagged with their source)
  opex: { service: string; monthlyPence: number; note: string }[];
}

/** Guard against a single failing query blowing up the whole payload.
 *  Admin hub must render SOMETHING even if D1 has partial outages. */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[admin/hub] ${label} failed:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

async function countOne(db: D1Database, sql: string, ...binds: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...binds).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getHubPayload(env: Env): Promise<HubPayload> {
  const db = env.DB;

  // ── Headline KPIs ─────────────────────────────────────────
  const [
    totalUsers,
    signupsToday,
    activeUsers30d,
    invoicesToday,
    uncategorisedTxns,
    mrrPence,
    activeSubsCount,
  ] = await Promise.all([
    safe('users.total',    () => countOne(db, 'SELECT COUNT(*) as n FROM users'), 0),
    safe('users.today',    () => countOne(db, "SELECT COUNT(*) as n FROM users WHERE created_at >= datetime('now', 'start of day')"), 0),
    safe('users.active30', () => countOne(db, "SELECT COUNT(DISTINCT user_id) as n FROM transactions WHERE transaction_date >= date('now', '-30 days')"), 0),
    safe('invoices.today', () => countOne(db, "SELECT COUNT(*) as n FROM invoices WHERE created_at >= datetime('now', 'start of day')"), 0),
    safe('txns.uncat',     () => countOne(db, 'SELECT COUNT(*) as n FROM transactions WHERE category_id IS NULL AND ai_category IS NULL'), 0),
    safe('subs.mrr',       () => countOne(db, "SELECT COALESCE(SUM(monthly_amount_pence), 0) as n FROM subscriptions WHERE status IN ('active', 'trialing') AND monthly_amount_pence IS NOT NULL"), 0),
    safe('subs.active',    () => countOne(db, "SELECT COUNT(*) as n FROM subscriptions WHERE status IN ('active', 'trialing')"), 0),
  ]);

  const kpis: HubKpi[] = [
    { label: 'Total users', value: totalUsers },
    { label: 'New today', value: signupsToday },
    { label: 'Active 30d', value: activeUsers30d },
    { label: 'MRR', value: mrrPence, unitPrefix: '£' },
    { label: 'Paying subs', value: activeSubsCount },
    { label: 'Invoices today', value: invoicesToday },
    { label: 'Uncat. txns', value: uncategorisedTxns },
  ];

  // ── Subs by status (all 5 states: active/trialing/past_due/cancelled/incomplete) ──
  const subsByStatus = await safe(
    'subs.byStatus',
    async () => {
      const r = await db
        .prepare('SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status')
        .all<{ status: string; count: number }>();
      return r.results ?? [];
    },
    [] as { status: string; count: number }[],
  );

  // ── Funnel ────────────────────────────────────────────────
  // signups (total users) → onboarding complete → bank connected → paid.
  // onboarding_completed lives on users.onboarding_completed. Bank-connected
  // means ≥1 row in bank_connections. Paid means sub.status='active'.
  const [onboardedCount, bankConnectedCount, paidCount] = await Promise.all([
    safe('funnel.onb',  () => countOne(db, 'SELECT COUNT(*) as n FROM users WHERE onboarding_completed = 1'), 0),
    safe('funnel.bank', () => countOne(db, 'SELECT COUNT(DISTINCT user_id) as n FROM bank_connections WHERE active = 1'), 0),
    safe('funnel.paid', () => countOne(db, "SELECT COUNT(*) as n FROM subscriptions WHERE status = 'active'"), 0),
  ]);
  const funnel: HubFunnelStep[] = [
    { label: 'Signed up',      count: totalUsers },
    { label: 'Onboarded',      count: onboardedCount },
    { label: 'Bank connected', count: bankConnectedCount },
    { label: 'Paying',         count: paidCount },
  ];

  // ── Bank connection health ────────────────────────────────
  const bankHealth = {
    activeCount: await safe('bank.active', () => countOne(db, 'SELECT COUNT(*) as n FROM bank_connections WHERE active = 1'), 0),
    expiredCount: await safe('bank.expired', () => countOne(db, "SELECT COUNT(*) as n FROM bank_connections WHERE active = 1 AND consent_expires_at IS NOT NULL AND consent_expires_at < datetime('now')"), 0),
    neverSyncedCount: await safe('bank.never', () => countOne(db, 'SELECT COUNT(*) as n FROM bank_connections WHERE active = 1 AND last_synced_at IS NULL'), 0),
    stale24hCount: await safe('bank.stale', () => countOne(db, "SELECT COUNT(*) as n FROM bank_connections WHERE active = 1 AND last_synced_at IS NOT NULL AND last_synced_at < datetime('now', '-24 hours')"), 0),
  };

  // ── MTD submissions ───────────────────────────────────────
  const mtdHealth = {
    submittedCount: await safe('mtd.sub', () => countOne(db, "SELECT COUNT(*) as n FROM mtd_submissions WHERE status IN ('submitted', 'accepted')"), 0),
    draftCount:     await safe('mtd.draft', () => countOne(db, "SELECT COUNT(*) as n FROM mtd_submissions WHERE status = 'draft'"), 0),
    rejectedCount:  await safe('mtd.rej', () => countOne(db, "SELECT COUNT(*) as n FROM mtd_submissions WHERE status = 'rejected'"), 0),
  };

  // ── Scheduled jobs ────────────────────────────────────────
  const jobs = await safe(
    'jobs',
    async () => {
      const r = await db
        .prepare('SELECT job_name, last_started_at, last_finished_at, last_duration_ms, last_status, last_error FROM scheduled_jobs ORDER BY job_name')
        .all<{
          job_name: string; last_started_at: string | null; last_finished_at: string | null;
          last_duration_ms: number | null; last_status: 'success' | 'failed' | 'running' | null; last_error: string | null;
        }>();
      const now = Date.now();
      return (r.results ?? []).map<HubJobStatus>((row) => ({
        name: row.job_name,
        lastStartedAt: row.last_started_at,
        lastFinishedAt: row.last_finished_at,
        lastDurationMs: row.last_duration_ms,
        lastStatus: row.last_status,
        lastError: row.last_error,
        staleHours: row.last_finished_at
          ? Math.floor((now - Date.parse(row.last_finished_at)) / 3_600_000)
          : null,
      }));
    },
    [] as HubJobStatus[],
  );

  // ── Incidents (derived from the above) ────────────────────
  // Rule of thumb: a warning shows when something's drifting; a critical
  // when it's actively failing. Kept narrow - the admin hub should show
  // 0 incidents on a good day, not be full of noise.
  const incidents: HubIncident[] = [];
  if (bankHealth.expiredCount > 0) {
    incidents.push({
      severity: 'warning',
      label: `${bankHealth.expiredCount} expired bank connection${bankHealth.expiredCount === 1 ? '' : 's'}`,
      detail: 'Users will see stale data until they re-authorise',
    });
  }
  if (bankHealth.stale24hCount > 5) {
    incidents.push({
      severity: 'warning',
      label: `${bankHealth.stale24hCount} bank connections not synced in 24h`,
      detail: 'Daily cron may be failing or TrueLayer is rate-limiting',
    });
  }
  for (const job of jobs) {
    if (job.lastStatus === 'failed') {
      incidents.push({
        severity: 'critical',
        label: `Scheduled job "${job.name}" failed`,
        detail: job.lastError ? job.lastError.slice(0, 140) : 'Check Worker logs',
      });
    } else if (job.staleHours !== null && job.staleHours > 26) {
      incidents.push({
        severity: 'critical',
        label: `Scheduled job "${job.name}" hasn't run in ${job.staleHours}h`,
        detail: 'Cron trigger may be disabled',
      });
    }
  }
  if (mtdHealth.rejectedCount > 0) {
    incidents.push({
      severity: 'warning',
      label: `${mtdHealth.rejectedCount} MTD submission${mtdHealth.rejectedCount === 1 ? '' : 's'} rejected`,
      detail: 'User may need to amend and re-submit',
    });
  }
  if (uncategorisedTxns > 1000) {
    incidents.push({
      severity: 'warning',
      label: `${uncategorisedTxns} uncategorised transactions`,
      detail: 'AI categoriser is falling behind or ANTHROPIC_API_KEY is misconfigured',
    });
  }

  // ── Opex (monthly, in pence) ──────────────────────────────
  // Rough tier-based estimates; treat as a sanity check, not an invoice.
  // Real numbers come from each provider's billing page.
  const opex: { service: string; monthlyPence: number; note: string }[] = [
    { service: 'Cloudflare Workers', monthlyPence: 500,  note: '$5 Workers Paid plan' },
    { service: 'Cloudflare D1',      monthlyPence: 0,    note: 'Free tier while under 5M rows' },
    { service: 'Cloudflare Pages',   monthlyPence: 0,    note: 'Free tier' },
    { service: 'Clerk',              monthlyPence: 0,    note: `Free until 10k MAU (current: ~${totalUsers})` },
    { service: 'Stripe fees (est.)', monthlyPence: Math.round(mrrPence * 0.024), note: '~2.4% on MRR' },
    { service: 'Anthropic (est.)',   monthlyPence: Math.round(activeUsers30d * 4), note: '£0.04 per active user/mo' },
    { service: 'Resend',             monthlyPence: 0,    note: 'Free under 3k emails/mo' },
    { service: 'TrueLayer',          monthlyPence: Math.round(bankHealth.activeCount * 50), note: 'Per-connection billing' },
  ];

  return {
    environment: env.ENVIRONMENT ?? 'unknown',
    generatedAt: new Date().toISOString(),
    kpis,
    incidents,
    funnel,
    subsByStatus,
    bankHealth,
    mtdHealth,
    jobs,
    opex,
  };
}

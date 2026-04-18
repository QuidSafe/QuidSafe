// Admin setup-checklist endpoint. Runs behind adminAuth middleware.
// Returns scrubbed env + migration + service state. Never returns secret
// values - only presence and (for previewable keys) the last 4 chars.

import type { Env } from '../index';
import {
  REQUIRED_ENV_VARS,
  MIGRATION_FILES,
  EXTERNAL_SERVICES,
  type RequiredEnvVar,
} from './config';

export interface EnvVarStatus {
  key: string;
  kind: 'secret' | 'var';
  description: string;
  present: boolean;
  preview: string | null; // e.g. "••••wxyz" or null
}

export interface MigrationStatus {
  filename: string;
  applied: boolean;
  appliedAt: string | null;
}

export interface ExternalServiceStatus {
  name: string;
  dashboardUrl: string;
  configured: boolean;
}

export interface SetupPayload {
  environment: string;
  generatedAt: string;
  envVars: EnvVarStatus[];
  migrations: {
    totalInRepo: number;
    totalApplied: number;
    latestApplied: string | null;
    latestAppliedAt: string | null;
    rows: MigrationStatus[];
  };
  externalServices: ExternalServiceStatus[];
  runtime: {
    commitSha: string | null;
    appUrl: string | null;
    sandboxBanking: boolean;
  };
}

function previewOf(value: string | undefined, allow: boolean): string | null {
  if (!allow || !value) return null;
  if (value.length < 4) return null;
  return `••••${value.slice(-4)}`;
}

function envVarStatus(spec: RequiredEnvVar, env: Env): EnvVarStatus {
  const raw = (env as unknown as Record<string, string | undefined>)[spec.key];
  const present = Boolean(raw && raw.length > 0);
  return {
    key: spec.key,
    kind: spec.kind,
    description: spec.description,
    present,
    preview: present ? previewOf(raw, spec.previewable) : null,
  };
}

export async function getSetupPayload(env: Env): Promise<SetupPayload> {
  // Wrangler auto-creates d1_migrations when migrations_dir is configured.
  // Rows look like { id, name, applied_at }. If the table doesn't exist yet
  // (e.g. fresh local DB, no migrations applied), catch and return empty.
  let appliedRows: { name: string; applied_at: string }[] = [];
  try {
    const result = await env.DB
      .prepare('SELECT name, applied_at FROM d1_migrations ORDER BY id ASC')
      .all<{ name: string; applied_at: string }>();
    appliedRows = result.results ?? [];
  } catch (err) {
    console.log('[admin] d1_migrations table unavailable:', err instanceof Error ? err.message : err);
  }

  const appliedByName = new Map(appliedRows.map((r) => [r.name, r.applied_at]));

  const migrationRows: MigrationStatus[] = MIGRATION_FILES.map((filename) => {
    // Wrangler records migrations by basename without the .sql extension.
    const nameNoExt = filename.replace(/\.sql$/, '');
    const appliedAt = appliedByName.get(nameNoExt) ?? appliedByName.get(filename) ?? null;
    return {
      filename,
      applied: appliedAt !== null,
      appliedAt,
    };
  });

  const totalApplied = migrationRows.filter((m) => m.applied).length;
  const latest = [...migrationRows].reverse().find((m) => m.applied) ?? null;

  const envVarsStatus = REQUIRED_ENV_VARS.map((spec) => envVarStatus(spec, env));
  const presentKeys = new Set(envVarsStatus.filter((v) => v.present).map((v) => v.key));

  const externalServices: ExternalServiceStatus[] = EXTERNAL_SERVICES.map((svc) => ({
    name: svc.name,
    dashboardUrl: svc.dashboardUrl,
    configured: svc.configuredWhen.length === 0
      ? true
      : svc.configuredWhen.every((k) => presentKeys.has(k)),
  }));

  return {
    environment: env.ENVIRONMENT ?? 'unknown',
    generatedAt: new Date().toISOString(),
    envVars: envVarsStatus,
    migrations: {
      totalInRepo: MIGRATION_FILES.length,
      totalApplied,
      latestApplied: latest?.filename ?? null,
      latestAppliedAt: latest?.appliedAt ?? null,
      rows: migrationRows,
    },
    externalServices,
    runtime: {
      // COMMIT_SHA isn't currently injected - surface as null until the deploy
      // pipeline starts setting it. Keeps the contract stable in the meantime.
      commitSha: (env as unknown as Record<string, string | undefined>).COMMIT_SHA ?? null,
      appUrl: env.APP_URL ?? null,
      sandboxBanking: env.TRUELAYER_SANDBOX === 'true',
    },
  };
}

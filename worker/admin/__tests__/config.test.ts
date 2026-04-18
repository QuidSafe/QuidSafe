// Drift test: the admin setup tab depends on MIGRATION_FILES matching what's
// actually in worker/migrations/. If this test fails, you either:
//   - added a migration but forgot to update MIGRATION_FILES (most likely), or
//   - renamed/removed a migration (rare - migrations are append-only).
//
// Fix by updating worker/admin/config.ts to match the filesystem.

import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MIGRATION_FILES, REQUIRED_ENV_VARS, EXTERNAL_SERVICES } from '../config';

describe('admin config', () => {
  it('MIGRATION_FILES matches worker/migrations/ on disk', () => {
    const dir = resolve(__dirname, '..', '..', 'migrations');
    const onDisk = readdirSync(dir)
      .filter((f) => f.endsWith('.sql') && f !== 'seed.sql')
      .sort();

    expect([...MIGRATION_FILES].sort()).toEqual(onDisk);
  });

  it('REQUIRED_ENV_VARS has no duplicate keys', () => {
    const keys = REQUIRED_ENV_VARS.map((v) => v.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('EXTERNAL_SERVICES reference only known env keys', () => {
    const knownKeys = new Set(REQUIRED_ENV_VARS.map((v) => v.key));
    for (const svc of EXTERNAL_SERVICES) {
      for (const k of svc.configuredWhen) {
        expect(knownKeys.has(k), `${svc.name} references unknown env key ${k}`).toBe(true);
      }
    }
  });
});

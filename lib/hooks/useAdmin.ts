// Admin-only hooks. The Worker enforces the ADMIN_EMAILS allowlist at the
// API layer - these hooks just surface that failure (404 from the Worker)
// as "not an admin" so the frontend can hide admin UI / redirect.
//
// Multi-env: admin is logged into prod (quidsafe.uk), but the page fetches
// setup state from dev/staging/production APIs in parallel. Works because
// all envs share the same Clerk instance, so the JWT from prod login is
// valid against every env's Worker.

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { AdminSetupPayload } from '../types';

export type EnvKey = 'production' | 'staging' | 'dev';

export interface EnvDescriptor {
  key: EnvKey;
  label: string;
  apiUrl: string;
}

export const ENVIRONMENTS: EnvDescriptor[] = [
  { key: 'production', label: 'Production', apiUrl: 'https://api.quidsafe.uk' },
  { key: 'staging',    label: 'Staging',    apiUrl: 'https://api-staging.quidsafe.uk' },
  { key: 'dev',        label: 'Dev',        apiUrl: 'https://quidsafe-api-dev.nathanlufc.workers.dev' },
];

/** True if the current user is in the Worker's ADMIN_EMAILS allowlist on the
 *  environment the page itself runs on. Used to gate the admin UI at all. */
export function useAdminAccess() {
  return useQuery({
    queryKey: ['admin', 'check'],
    queryFn: () => api.getAdminCheck(),
    staleTime: 30_000,
    retry: false,
  });
}

export type EnvSetupResult =
  | { status: 'ok'; payload: AdminSetupPayload }
  | { status: 'not-admin' }      // Worker says admin-gate denied us (404 from adminAuth)
  | { status: 'unreachable'; message: string } // network error, CORS, 500, CONFIG_ERROR
  | { status: 'loading' };

/** Full setup-checklist for a specific env. Falls back to error states so the
 *  UI can show something meaningful even when an env is misconfigured. */
export function useEnvSetup(env: EnvDescriptor) {
  return useQuery<EnvSetupResult>({
    queryKey: ['admin', 'setup', env.key],
    queryFn: async () => {
      try {
        const payload = await api.getAdminSetupFor(env.apiUrl);
        return { status: 'ok', payload } as const;
      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        // Worker returns 404 with "Route not found" for non-admins (adminAuth)
        if (/not found/i.test(rawMsg) || /404/.test(rawMsg)) {
          return { status: 'not-admin' } as const;
        }
        // Sanitise before surfacing to the UI: first line only, max 200 chars.
        // Upstream errors sometimes carry stack frames or provider-specific
        // internals we don't want on screen.
        const msg = rawMsg.split('\n')[0].slice(0, 200);
        return { status: 'unreachable', message: msg } as const;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

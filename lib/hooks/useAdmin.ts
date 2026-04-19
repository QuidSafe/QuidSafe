// Admin-only hooks. The Worker enforces the ADMIN_EMAILS allowlist at the
// API layer - these hooks just surface that failure (404 from the Worker)
// as "not an admin" so the frontend can hide admin UI / redirect.
//
// These hooks intentionally bypass the shared ApiClient and call fetch()
// directly with a fresh Clerk token. The shared client has a setup race
// (tokenProvider registered in a useEffect, but React Query queries can
// fire before that effect runs) that produces silent 401s without an
// Authorization header. Admin checks are low-volume and sensitive, so
// doing a direct fetch per call is worth the slight duplication.

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import type { AdminSetupPayload, AdminHubPayload } from '../types';

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

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.quidsafe.uk';

async function fetchAdmin<T>(baseUrl: string, path: string, token: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
    const err = new Error((body as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }
  return response.json() as Promise<T>;
}

/** True if the current user is in the Worker's ADMIN_EMAILS allowlist. */
export function useAdminAccess() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['admin', 'check'],
    enabled: isSignedIn === true,
    queryFn: async () => {
      const token = await getToken();
      return fetchAdmin<{ admin: true }>(DEFAULT_API_BASE, '/admin/check', token);
    },
    staleTime: 30_000,
    retry: false,
  });
}

export type EnvSetupResult =
  | { status: 'ok'; payload: AdminSetupPayload }
  | { status: 'not-admin' }
  | { status: 'unreachable'; message: string }
  | { status: 'loading' };

/** Full setup-checklist for a specific env. Falls back to error states so the
 *  UI can show something meaningful even when an env is misconfigured. */
export function useEnvSetup(env: EnvDescriptor) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EnvSetupResult>({
    queryKey: ['admin', 'setup', env.key],
    enabled: isSignedIn === true,
    queryFn: async () => {
      try {
        const token = await getToken();
        const payload = await fetchAdmin<AdminSetupPayload>(env.apiUrl, '/admin/setup', token);
        return { status: 'ok', payload } as const;
      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const status = (err as Error & { status?: number }).status;
        if (status === 404 || /not found/i.test(rawMsg)) {
          return { status: 'not-admin' } as const;
        }
        // Sanitise before surfacing to the UI: first line only, max 200 chars.
        const msg = rawMsg.split('\n')[0].slice(0, 200);
        return { status: 'unreachable', message: msg } as const;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export type EnvHubResult =
  | { status: 'ok'; payload: AdminHubPayload }
  | { status: 'not-admin' }
  | { status: 'unreachable'; message: string }
  | { status: 'loading' };

/** Business-at-a-glance snapshot for a specific env. Same error-state
 *  contract as useEnvSetup so the UI can handle them identically. */
export function useEnvHub(env: EnvDescriptor) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EnvHubResult>({
    queryKey: ['admin', 'hub', env.key],
    enabled: isSignedIn === true,
    queryFn: async () => {
      try {
        const token = await getToken();
        const payload = await fetchAdmin<AdminHubPayload>(env.apiUrl, '/admin/hub', token);
        return { status: 'ok', payload } as const;
      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const status = (err as Error & { status?: number }).status;
        if (status === 404 || /not found/i.test(rawMsg)) {
          return { status: 'not-admin' } as const;
        }
        const msg = rawMsg.split('\n')[0].slice(0, 200);
        return { status: 'unreachable', message: msg } as const;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

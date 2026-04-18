// Admin-only hooks. The Worker enforces the ADMIN_EMAILS allowlist at the
// API layer - these hooks just surface that failure (404 from the Worker)
// as "not an admin" so the frontend can hide admin UI / redirect.

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

/** True if the current user is in the Worker's ADMIN_EMAILS allowlist. */
export function useAdminAccess() {
  return useQuery({
    queryKey: ['admin', 'check'],
    queryFn: () => api.getAdminCheck(),
    // Short stale window so a revoked admin loses access quickly
    staleTime: 30_000,
    retry: false,
  });
}

/** Full setup-checklist payload. Do not call this from non-admin routes. */
export function useAdminSetup() {
  return useQuery({
    queryKey: ['admin', 'setup'],
    queryFn: () => api.getAdminSetup(),
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Error reporting scaffold. Currently logs to console.
 * To wire up Sentry later:
 *   1. npm install sentry-expo
 *   2. Initialise in app/_layout.tsx: Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })
 *   3. Replace the body of reportError() below with Sentry.captureException(error, { extra: context })
 *
 * Until a DSN is set, this is a no-op in production (silently drops the log) and
 * logs to console in development.
 */

type ErrorContext = Record<string, unknown>;

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Report an unexpected error. Call this from catch blocks where the error
 * is worth investigating (not validation failures or user input errors).
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (isDev) {
    console.error('[QuidSafe error]', error, context);
    return;
  }

  if (!SENTRY_DSN) {
    // Production without Sentry - drop silently to avoid polluting logs
    return;
  }

  // TODO: Sentry.captureException(error, { extra: context });
  // For now, log minimal info until Sentry is wired up
  console.error('[QuidSafe]', error instanceof Error ? error.message : String(error));
}

/**
 * Add breadcrumb for debugging (no-op until Sentry is wired).
 * Call this to record user actions leading up to an error.
 */
export function addBreadcrumb(_message: string, _category?: string, _data?: ErrorContext): void {
  // TODO: Sentry.addBreadcrumb({ message, category, data })
}

/**
 * Set user context for error reports (call on sign-in).
 */
export function setErrorUser(_userId: string | null): void {
  // TODO: Sentry.setUser({ id: userId })
}

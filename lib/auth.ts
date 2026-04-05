// Clerk auth initialisation for QuidSafe
// Used by the Expo app — ClerkProvider wraps the root layout

import { tokenCache } from '@clerk/clerk-expo/token-cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — add it to .env.local (see .env.example)',
  );
}

export { publishableKey, tokenCache };

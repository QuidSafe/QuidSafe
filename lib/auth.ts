// Clerk auth initialisation for QuidSafe
// Used by the Expo app — ClerkProvider wraps the root layout

import { Platform } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

let tokenCache: Parameters<typeof import('@clerk/clerk-expo')['ClerkProvider']>[0]['tokenCache'];

async function initTokenCache() {
  if (Platform.OS !== 'web') {
    try {
      const mod = await import('@clerk/clerk-expo/token-cache');
      tokenCache = mod.tokenCache;
    } catch {
      // Fallback: no token cache on web/SSR
    }
  }
}

initTokenCache();

export { publishableKey, tokenCache };

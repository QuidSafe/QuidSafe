// Clerk auth initialisation for QuidSafe
// Used by the Expo app — ClerkProvider wraps the root layout

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
if (!publishableKey && typeof window !== 'undefined') {
  console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — Clerk auth will not work');
}

const tokenCache =
  Platform.OS !== 'web'
    ? {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch {
            return null;
          }
        },
        async saveToken(key: string, value: string) {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch {
            // Silently fail on web/unsupported platforms
          }
        },
      }
    : undefined;

export { publishableKey, tokenCache };

import { useFonts } from 'expo-font';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { SourceSans3_400Regular, SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HeadMeta } from '@/components/web/HeadMeta';
import { Providers } from '@/components/Providers';
import { AuthRedirect } from '@/lib/AuthRedirect';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { EnvBanner } from '@/components/ui/EnvBanner';
import 'react-native-reanimated';
// @ts-ignore - CSS import for web, ignored on native
import '../public/global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <HeadMeta />
      <Providers>
        <StatusBar style="light" />
        <EnvBanner />
        <CookieConsent />
        <AuthRedirect>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="landing" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="transactions" options={{ presentation: 'modal' }} />
            <Stack.Screen name="billing" />
            <Stack.Screen name="billing/success" />
            <Stack.Screen name="billing/cancel" />
            <Stack.Screen name="mtd" options={{ presentation: 'modal' }} />
            <Stack.Screen name="invoices" />
            <Stack.Screen name="invoice/[id]" />
            <Stack.Screen name="expense/[id]" />
            <Stack.Screen name="status" />
            <Stack.Screen name="self-assessment" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="about" />
            <Stack.Screen name="cookie-policy" />
            <Stack.Screen name="tax-history" />
            <Stack.Screen name="pnl-report" />
            <Stack.Screen name="mileage" />
            <Stack.Screen name="clients" />
            <Stack.Screen name="auth-debug" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthRedirect>
      </Providers>
    </>
  );
}

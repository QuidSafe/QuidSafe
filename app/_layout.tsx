import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { publishableKey, tokenCache } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BiometricGate } from '@/components/ui/BiometricGate';
import { useApiToken } from '@/lib/hooks/useApi';
import { registerForPushNotifications } from '@/lib/notifications';
import 'react-native-reanimated';
// @ts-ignore — CSS import for web, ignored on native
import '../public/global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  useApiToken(); // Sync Clerk token once at root level
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onLanding = segments[0] === 'landing';

    if (isSignedIn && (inAuthGroup || onLanding)) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup && !onLanding) {
      router.replace('/landing');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  // Register for push notifications once when signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || pushTokenRef.current) return;

    registerForPushNotifications().then((token) => {
      if (token) pushTokenRef.current = token;
    });
  }, [isLoaded, isSignedIn]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
    <Head>
      <title>QuidSafe — Tax Tracking for UK Sole Traders</title>
      <meta name="description" content="Connect your bank, auto-categorise expenses, and know exactly what to set aside for HMRC. Smart tax tracking for UK sole traders." />
      <meta name="theme-color" content="#0F172A" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <meta property="og:title" content="QuidSafe — Tax Tracking for UK Sole Traders" />
      <meta property="og:description" content="Connect your bank, auto-categorise expenses, and know exactly what to set aside for HMRC." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quidsafe.pages.dev" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="QuidSafe — Tax Tracking for UK Sole Traders" />
      <meta name="twitter:description" content="Smart tax tracking for UK sole traders." />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="QuidSafe" />
      <link rel="apple-touch-icon" href="/assets/images/icon.png" />
      <link rel="manifest" href="/manifest.json" />
      {/* Preconnect to Google Fonts for faster loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Load Manrope + Playfair Display via CSS for reliable web rendering */}
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </Head>
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <BiometricGate>
              <AppErrorBoundary>
                <ThemedStatusBar />
                <AuthRedirect>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="landing" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="transactions" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="billing" options={{ headerShown: false }} />
                    <Stack.Screen name="mtd" options={{ headerShown: false, presentation: 'modal' }} />
                    <Stack.Screen name="invoices" options={{ headerShown: false }} />
                    <Stack.Screen name="invoice/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="expense/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="status" options={{ headerShown: false }} />
                    <Stack.Screen name="self-assessment" options={{ headerShown: false }} />
                    <Stack.Screen name="privacy" options={{ headerShown: false }} />
                    <Stack.Screen name="terms" options={{ headerShown: false }} />
                    <Stack.Screen name="about" options={{ headerShown: false }} />
                    <Stack.Screen name="cookie-policy" options={{ headerShown: false }} />
                    <Stack.Screen name="tax-history" options={{ headerShown: false }} />
                    <Stack.Screen name="widget-preview" options={{ headerShown: false }} />
                    <Stack.Screen name="screenshots" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </AuthRedirect>
              </AppErrorBoundary>
              </BiometricGate>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </>
  );
}

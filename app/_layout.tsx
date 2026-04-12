import { useFonts } from 'expo-font';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
} from '@expo-google-fonts/source-sans-3';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { publishableKey, tokenCache } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { AppErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BiometricGate } from '@/components/ui/BiometricGate';
import { useApiToken } from '@/lib/hooks/useApi';
import { registerForPushNotifications } from '@/lib/notifications';
import { CookieConsent } from '@/components/ui/CookieConsent';
import 'react-native-reanimated';
// @ts-ignore - CSS import for web, ignored on native
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
  return <StatusBar style="light" />;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  useApiToken();
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const pushTokenRef = useRef<string | null>(null);
  // Once true, stays true for this page lifetime. Prevents Clerk's
  // session-refresh flicker (true→false→true) from bouncing users
  // to /landing after they've already authenticated.
  const hasBeenSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (typeof isSignedIn !== 'boolean') return;

    if (isSignedIn) hasBeenSignedIn.current = true;

    const inAuthGroup = segments[0] === '(auth)';
    const onLanding = segments[0] === 'landing';
    const onDebug = segments[0] === 'auth-debug';

    if (isSignedIn === true && (inAuthGroup || onLanding)) {
      router.replace('/(tabs)');
    } else if (isSignedIn === false && !hasBeenSignedIn.current && !inAuthGroup && !onLanding && !onDebug) {
      // Only redirect to landing if the user was NEVER signed in during
      // this page load. Explicit sign-out in settings.tsx handles its
      // own navigation via router.replace('/(auth)/login').
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

  // Handle OAuth deep link callbacks (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Linking.addEventListener('url', (event) => {
      const parsed = Linking.parse(event.url);
      if (parsed.hostname === 'banking' && parsed.path === 'callback') {
        WebBrowser.dismissBrowser();
        queryClient.invalidateQueries({ queryKey: ['banking'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (parsed.queryParams?.error) {
          toast.show('Bank connection failed. Please try again.', 'error');
        } else if (parsed.queryParams?.syncError) {
          toast.show('Bank connected, but initial sync had an issue. It will retry automatically.', 'warning');
        } else {
          toast.show('Bank account connected successfully', 'success');
        }
      } else if (parsed.hostname === 'hmrc' && parsed.path === 'callback') {
        WebBrowser.dismissBrowser();
        queryClient.invalidateQueries({ queryKey: ['mtd'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (parsed.queryParams?.error) {
          toast.show('Could not connect to HMRC. Please try again.', 'error');
        } else {
          toast.show('HMRC connected successfully', 'success');
        }
      }
    });

    return () => subscription.remove();
  }, [queryClient, toast]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
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
      {/* ── Primary SEO ── */}
      <title>QuidSafe - Tax Tracking for UK Sole Traders | MTD Compliant</title>
      <meta name="description" content="QuidSafe connects to your bank via Open Banking, auto-categorises transactions with AI, and tells you exactly what to set aside for HMRC. Making Tax Digital compliant. Free 14-day trial. £7.99/month." />
      <meta name="keywords" content="sole trader tax, UK tax tracking, Making Tax Digital, MTD software, HMRC tax calculator, self-assessment tax, sole trader expenses, Open Banking tax app, auto categorise expenses, tax set aside calculator, National Insurance calculator, Class 4 NI, income tax calculator UK, quarterly tax submissions, TrueLayer, sole trader accounting" />
      <meta name="author" content="QuidSafe Ltd" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="theme-color" content="#000000" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <link rel="canonical" href="https://quidsafe.uk" />

      {/* ── Open Graph (Facebook, LinkedIn, WhatsApp, iMessage) ── */}
      <meta property="og:site_name" content="QuidSafe" />
      <meta property="og:title" content="QuidSafe - Smart Tax Tracking for UK Sole Traders" />
      <meta property="og:description" content="Connect your bank, auto-categorise expenses with AI, and know exactly what to set aside for HMRC. MTD compliant. Free 14-day trial." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quidsafe.uk" />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:image" content="https://quidsafe.uk/assets/images/icon.png" />
      <meta property="og:image:width" content="1024" />
      <meta property="og:image:height" content="1024" />
      <meta property="og:image:alt" content="QuidSafe shield logo with pound symbol" />

      {/* ── Twitter / X ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="QuidSafe - Tax Tracking for UK Sole Traders" />
      <meta name="twitter:description" content="Connect your bank, auto-categorise expenses with AI, and know exactly what to set aside for HMRC. MTD compliant." />
      <meta name="twitter:image" content="https://quidsafe.uk/assets/images/icon.png" />

      {/* ── PWA / Mobile ── */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="QuidSafe" />
      <meta name="application-name" content="QuidSafe" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#000000" />
      <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
      <link rel="apple-touch-icon" href="/assets/images/icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* ── GEO: Location targeting for UK ── */}
      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="United Kingdom" />
      <meta name="ICBM" content="51.5074, -0.1278" />
      <meta name="DC.language" content="en-GB" />

      {/* ── JSON-LD: SoftwareApplication schema for AI/search engines ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "QuidSafe",
        "description": "QuidSafe is a tax tracking app built for UK sole traders. It connects to your bank via Open Banking, auto-categorises transactions with AI, and tells you exactly how much to set aside for HMRC - updated in real time. Making Tax Digital (MTD) compliant.",
        "url": "https://quidsafe.uk",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "iOS, Android, Web",
        "offers": {
          "@type": "Offer",
          "price": "7.99",
          "priceCurrency": "GBP",
          "priceValidUntil": "2027-12-31",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "Open Banking integration via TrueLayer (FCA authorised AISP)",
          "AI auto-categorisation of transactions",
          "Real-time Income Tax and National Insurance calculator",
          "Making Tax Digital (MTD) quarterly submissions to HMRC",
          "Monthly tax set-aside calculator",
          "Professional invoice creation and tracking",
          "AES-256 encryption for bank-grade security",
          "Full CSV data export",
          "Works with Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Revolut, Nationwide"
        ],
        "screenshot": "https://quidsafe.uk/assets/images/icon.png",
        "author": {
          "@type": "Organization",
          "name": "QuidSafe Ltd",
          "url": "https://quidsafe.uk"
        }
      }) }} />

      {/* ── JSON-LD: FAQPage schema for rich snippets ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is QuidSafe?",
            "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe is a tax tracking app built specifically for UK sole traders. It connects to your bank via Open Banking, auto-categorises your transactions with AI, and tells you exactly how much to set aside for HMRC - updated in real time." }
          },
          {
            "@type": "Question",
            "name": "Is my bank data safe with QuidSafe?",
            "acceptedAnswer": { "@type": "Answer", "text": "Yes. QuidSafe uses AES-256 encryption (the same standard used by banks), Open Banking is regulated by the FCA, and we only ever have read-only access to your transactions. We can never move money or make payments from your account." }
          },
          {
            "@type": "Question",
            "name": "What is Making Tax Digital and do I need it?",
            "acceptedAnswer": { "@type": "Answer", "text": "Making Tax Digital (MTD) for Income Tax requires sole traders to keep digital records and submit quarterly updates to HMRC. It becomes mandatory from April 2026 for income over £50,000 and April 2027 for income over £30,000. QuidSafe handles this automatically." }
          },
          {
            "@type": "Question",
            "name": "How much does QuidSafe cost?",
            "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe is £7.99/month or £79.99/year (save 17%) - all prices include VAT. Every plan includes all features - AI categorisation, MTD submissions, unlimited bank accounts, and more. VAT-registered sole traders can reclaim VAT. Start with a free 14-day trial, no credit card required." }
          },
          {
            "@type": "Question",
            "name": "What banks does QuidSafe support?",
            "acceptedAnswer": { "@type": "Answer", "text": "QuidSafe supports all major UK banks through TrueLayer Open Banking, including Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Nationwide, Revolut, and many more." }
          }
        ]
      }) }} />

      {/* ── JSON-LD: Organization schema ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "QuidSafe",
        "legalName": "QuidSafe Ltd",
        "url": "https://quidsafe.uk",
        "logo": "https://quidsafe.uk/assets/images/icon.png",
        "description": "Smart tax tracking for UK sole traders. Open Banking, AI categorisation, MTD compliant.",
        "foundingDate": "2025",
        "areaServed": { "@type": "Country", "name": "United Kingdom" },
        "knowsAbout": ["sole trader tax", "Making Tax Digital", "HMRC", "self-assessment", "National Insurance", "Open Banking", "expense categorisation"]
      }) }} />

      {/* ── Plausible Analytics (privacy-friendly, no cookies, GDPR-compliant) ── */}
      <script
        defer
        data-domain="quidsafe.uk"
        src="https://plausible.io/js/script.js"
      />

      {/* Fonts bundled via @expo-google-fonts/* - no external CDN fetch */}
    </Head>
    {publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <BiometricGate>
              <AppErrorBoundary>
                <ThemedStatusBar />
                <CookieConsent />
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
                    <Stack.Screen name="auth-debug" options={{ headerShown: false }} />
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
    ) : null}
    </>
  );
}

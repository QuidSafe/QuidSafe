import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useToast } from '@/components/ui/Toast';
import { useApiToken } from '@/lib/hooks/useApi';
import { registerForPushNotifications } from '@/lib/notifications';

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  useApiToken();
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (typeof isSignedIn !== 'boolean') return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === '(auth)';

    // Root URL (/) renders the landing page directly via app/index.tsx,
    // so there is no redirect needed when signed out at root.
    const onIndex = !firstSegment;
    const onLanding = firstSegment === 'landing';

    if (isSignedIn === true && (inAuthGroup || onLanding || onIndex)) {
      // Signed in but on auth/landing/root — go to the app
      router.replace('/(tabs)');
    }
    // All other cases (signed in elsewhere, signed out anywhere): stay put.
    // If a signed-out user navigates to a protected route, API calls will
    // fail and show error states rather than yank them away.
  }, [isSignedIn, isLoaded, segments, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || pushTokenRef.current) return;
    registerForPushNotifications().then((token) => {
      if (token) pushTokenRef.current = token;
    });
  }, [isLoaded, isSignedIn]);

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

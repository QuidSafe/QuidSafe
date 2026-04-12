import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useStableAuth } from '@/lib/hooks/useStableAuth';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useToast } from '@/components/ui/Toast';
import { useApiToken } from '@/lib/hooks/useApi';
import { registerForPushNotifications } from '@/lib/notifications';

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  useApiToken();
  const { isSignedIn, isLoaded } = useStableAuth();
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

    if (isSignedIn === true && (inAuthGroup || firstSegment === 'landing')) {
      // Signed in but on auth/landing page — go to the app
      router.replace('/(tabs)');
    } else if (isSignedIn === false && inAuthGroup) {
      // Not signed in and in auth group — stay (this is correct)
    } else if (isSignedIn === false && !firstSegment) {
      // Not signed in at root URL — go to landing
      router.replace('/landing');
    }
    // All other cases: stay where you are. If the user is on /(tabs)
    // or /onboarding or any other route without being signed in, the
    // API calls will fail naturally and show error states. We don't
    // forcefully yank them to /landing.
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

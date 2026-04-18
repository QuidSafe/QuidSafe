import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/Colors';
import { useAdminAccess } from '@/lib/hooks/useAdmin';

// Admin route group. The Worker is the real gate (ADMIN_EMAILS allowlist) -
// this layout just provides a nicer UX by redirecting non-admins to the app
// home instead of showing a 403 payload.
export default function AdminLayout() {
  const router = useRouter();
  const { isLoading, isError } = useAdminAccess();

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isError, router]);

  if (isLoading || isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" />
    </Stack>
  );
}

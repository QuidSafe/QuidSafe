import { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { hapticSuccess } from '@/lib/haptics';

// Stripe redirects here with ?session_id=... after a completed checkout.
// We invalidate billing-related queries so the app picks up the new
// subscription status, then push back to the dashboard. The webhook
// handler has already persisted the subscription - this screen is
// purely visual confirmation.
export default function BillingSuccessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['billing'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    hapticSuccess();
    // Log session_id for support debugging - not sensitive on its own
    if (session_id) console.log('[billing] checkout success', session_id);
  }, [queryClient, session_id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CheckCircle size={48} color={Colors.success} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>You&apos;re in</Text>
        <Text style={styles.sub}>
          Your 30-day free trial has started. We&apos;ll remind you before it ends - no surprises.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Go to dashboard"
        >
          <Text style={styles.ctaText}>Go to dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,200,83,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.electricBlue,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl + Spacing.sm,
    borderRadius: BorderRadius.button,
    minWidth: 220,
    alignItems: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
});

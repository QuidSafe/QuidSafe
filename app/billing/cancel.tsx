import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { XCircle } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

// Stripe redirects here if the user backs out of checkout. No charge
// was made. Gives them a clear "you didn't pay" signal and a one-click
// path to retry or go back to the app.
export default function BillingCancelScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <XCircle size={48} color={Colors.warning} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Checkout cancelled</Text>
        <Text style={styles.sub}>
          No charge was made. You can try again or head back to the app - your account is unaffected.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => router.replace('/billing')}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Back to app"
        >
          <Text style={styles.secondaryText}>Back to app</Text>
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
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,149,0,0.12)',
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
  primary: {
    backgroundColor: Colors.electricBlue,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl + Spacing.sm,
    borderRadius: BorderRadius.button,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  secondary: {
    paddingVertical: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

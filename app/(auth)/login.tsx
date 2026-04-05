import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  }, [startSSOFlow]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>QuidSafe</Text>
        <Text style={styles.tagline}>Your tax. Sorted. Safe.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>Bank-grade encryption  ·  Read-only access  ·  HMRC compliant</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/(auth)/signup" asChild>
          <Pressable style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}>
            <Text style={styles.emailText}>Continue with Email</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 44,
    color: Colors.primary,
  },
  tagline: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  trustBadge: {
    backgroundColor: Colors.secondary + '10',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trustText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: Colors.secondary,
  },
  googleButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    ...Shadows.soft,
  },
  googleText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  emailButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  emailText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.grey[500],
    textAlign: 'center',
  },
});

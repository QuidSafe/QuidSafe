import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>QuidSafe</Text>
        <Text style={styles.tagline}>UK sole trader tax, simplified</Text>
      </View>

      <View style={styles.form}>
        <Pressable style={styles.magicLinkButton}>
          <Text style={styles.magicLinkText}>Continue with Magic Link</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.googleButton}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/(auth)/signup" style={styles.link}>
            Sign up
          </Link>
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
    fontSize: 40,
    color: Colors.primary,
  },
  tagline: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  magicLinkButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    ...Shadows.soft,
  },
  magicLinkText: {
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
  googleButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.soft,
  },
  googleText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
});

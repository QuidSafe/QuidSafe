import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSSO, useSignIn } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Lock, Mail } from 'lucide-react-native';
import { Spacing, colors as designColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setError('');
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Platform.OS === 'web' ? window.location.origin : undefined,
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
    }
  }, [startSSOFlow]);

  const handleEmailSignIn = useCallback(async () => {
    if (!isLoaded || !signIn) return;
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Unable to sign in. Please check your details.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, email, password]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={s.safe}>
        {/* Shield icon */}
        <View style={s.iconWrap}>
          <View style={s.iconGlowDark} />
          <View style={[s.iconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Shield size={32} color={colors.accent} strokeWidth={1.5} />
          </View>
        </View>

        <View style={s.brandWrap}>
          <Text style={[s.logo, { color: colors.text }]}>QuidSafe</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>Welcome back</Text>
        </View>

        {/* Google SSO */}
        <View style={s.authSection}>
          <Pressable
            style={({ pressed }) => [s.googleBtn, pressed && s.pressed]}
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Mail size={18} color={designColors.text} strokeWidth={1.5} />
            <Text style={s.googleText}>Continue with Google</Text>
          </Pressable>

          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email input */}
          <View style={[s.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Mail size={15} color={colors.textMuted} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <TextInput
              style={[s.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          {/* Password input */}
          <View style={[s.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Lock size={15} color={colors.textMuted} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <TextInput
              style={[s.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={handleEmailSignIn}
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [s.ctaBtn, loading && s.ctaBtnDisabled, pressed && s.pressed]}
            onPress={handleEmailSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {loading ? (
              <ActivityIndicator color={designColors.text} />
            ) : (
              <Text style={s.ctaText}>Sign in</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            accessibilityRole="link"
            accessibilityLabel="Create an account"
          >
            <Text style={[s.switchText, { color: colors.textSecondary }]}>
              Don&apos;t have an account? <Text style={s.switchLink}>Sign up</Text>
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Link href="/terms"><Text style={s.footerLink}>Terms</Text></Link>
            {' '}and{' '}
            <Link href="/privacy"><Text style={s.footerLink}>Privacy Policy</Text></Link>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg + 4,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%' as unknown as number,
    alignSelf: 'center',
  },

  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  iconGlowDark: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designColors.accentGlow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 36,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    marginTop: 6,
  },

  authSection: {
    gap: 14,
    marginBottom: 28,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: designColors.accent,
    paddingVertical: 15,
    borderRadius: 8,
  },
  googleText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: designColors.text,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 2,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    padding: 0,
  },

  ctaBtn: {
    backgroundColor: designColors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: designColors.text,
  },

  error: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: designColors.error,
    textAlign: 'center',
  },

  switchText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  switchLink: {
    color: designColors.accent,
    fontFamily: Fonts.sourceSans.semiBold,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: designColors.accent,
    textDecorationLine: 'underline',
  },
});

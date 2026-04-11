import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowLeft, Shield } from 'lucide-react-native';
import { Spacing, colors as designColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleGoogleSignUp = useCallback(async () => {
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
      const msg = err instanceof Error ? err.message : 'Google sign-up failed';
      setError(msg);
    }
  }, [startSSOFlow]);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, email, password]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded || !signUp || !code) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace('/onboarding');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, setActive, code, router]);

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

        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>
            {pendingVerification ? 'Check your email' : 'Create your account'}
          </Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            {pendingVerification
              ? `We sent a 6-digit code to ${email}`
              : 'Start tracking your tax in minutes'}
          </Text>
        </View>

        {!pendingVerification ? (
          <View style={s.form}>
            {/* Google SSO */}
            <Pressable
              style={({ pressed }) => [s.googleBtn, pressed && s.pressed]}
              onPress={handleGoogleSignUp}
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

            {/* Email */}
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

            {/* Password */}
            <View style={[s.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Lock size={15} color={colors.textMuted} strokeWidth={1.5} style={{ marginRight: 12 }} />
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Password (min 8 characters)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                onSubmitEditing={handleSignUp}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [s.ctaBtn, loading && s.ctaBtnDisabled, pressed && s.pressed]}
              onPress={handleSignUp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {loading ? (
                <ActivityIndicator color={designColors.text} />
              ) : (
                <Text style={s.ctaText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="link"
              accessibilityLabel="Sign in instead"
            >
              <Text style={[s.switchText, { color: colors.textSecondary }]}>
                Already have an account? <Text style={s.switchLink}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.form}>
            <View style={[s.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Lock size={16} color={colors.textMuted} strokeWidth={1.5} style={{ marginRight: 12 }} />
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                onSubmitEditing={handleVerify}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [s.ctaBtn, (loading || !code) && s.ctaBtnDisabled, pressed && s.pressed]}
              onPress={handleVerify}
              disabled={loading || !code}
              accessibilityRole="button"
              accessibilityLabel="Verify email"
            >
              {loading ? (
                <ActivityIndicator color={designColors.text} />
              ) : (
                <Text style={s.ctaText}>Verify & Continue</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setPendingVerification(false);
                setCode('');
                setError('');
              }}
              accessibilityRole="link"
              accessibilityLabel="Back to sign up"
            >
              <View style={s.backRow}>
                <ArrowLeft size={12} color={colors.accent} strokeWidth={1.5} />
                <Text style={s.switchLink}>Use a different email</Text>
              </View>
            </Pressable>
          </View>
        )}
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

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  form: {
    gap: 14,
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

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

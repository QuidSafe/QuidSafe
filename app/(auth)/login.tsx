import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useSSO, useSignIn } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { AuthLeftPanel } from '@/components/ui/AuthLeftPanel';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'forgot' | 'reset';

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop } = useResponsiveLayout();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

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
    if (isSignedIn) {
      router.replace('/(tabs)');
      return;
    }
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
        setError(`Sign in incomplete (status: ${result.status}). Please try again.`);
      }
    } catch (err: unknown) {
      const errObj = err as { errors?: Array<{ code?: string; message: string; longMessage?: string }> };
      const code = errObj?.errors?.[0]?.code;
      if (code === 'session_exists') {
        router.replace('/(tabs)');
        return;
      }
      const msg = errObj?.errors?.[0]?.longMessage || errObj?.errors?.[0]?.message
        || (err instanceof Error ? err.message : 'Sign in failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, email, password, isSignedIn, router]);

  const handleRequestReset = useCallback(async () => {
    if (!isLoaded || !signIn || !email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setMode('reset');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, email]);

  const handleResetPassword = useCallback(async () => {
    if (!isLoaded || !signIn) return;
    if (!resetCode || newPassword.length < 8) {
      setError('Enter the code and a new password of 8+ characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Reset incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, resetCode, newPassword]);

  const renderForm = () => {
    if (mode === 'reset') {
      return (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a code to {email}. Enter it below with your new password.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Verification code</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="6-digit code"
                placeholderTextColor={colors.textMuted}
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>New password</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Minimum 8 characters"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
                onSubmitEditing={handleResetPassword}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, loading && styles.btnDisabled, pressed && styles.pressed]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={styles.primaryBtnText}>Reset password</Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
              </>
            )}
          </Pressable>

          <Pressable onPress={() => { setMode('signin'); setError(''); }} style={styles.textLinkBtn}>
            <Text style={[styles.textLink, { color: colors.accent }]}>Back to sign in</Text>
          </Pressable>
        </>
      );
    }

    if (mode === 'forgot') {
      return (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Forgot password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we&apos;ll send you a code to reset it.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.inputWrap, { borderColor: emailFocus ? colors.accent : colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onSubmitEditing={handleRequestReset}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, loading && styles.btnDisabled, pressed && styles.pressed]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={styles.primaryBtnText}>Send reset code</Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
              </>
            )}
          </Pressable>

          <Pressable onPress={() => { setMode('signin'); setError(''); }} style={styles.textLinkBtn}>
            <Text style={[styles.textLink, { color: colors.accent }]}>Back to sign in</Text>
          </Pressable>
        </>
      );
    }

    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to your QuidSafe account.
        </Text>

        {/* Google SSO */}
        <Pressable
          style={({ pressed }) => [styles.ssoBtn, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}
          onPress={handleGoogleSignIn}
        >
          <GoogleIcon />
          <Text style={[styles.ssoText, { color: colors.text }]}>Continue with Google</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or sign in with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <View style={[
            styles.inputWrap,
            { borderColor: emailFocus ? colors.accent : colors.border, backgroundColor: colors.surface },
          ]}>
            <Mail size={16} color={colors.textMuted} strokeWidth={1.5} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <Pressable onPress={() => { setMode('forgot'); setError(''); }}>
              <Text style={[styles.labelLink, { color: colors.accent }]}>Forgot?</Text>
            </Pressable>
          </View>
          <View style={[
            styles.inputWrap,
            { borderColor: passwordFocus ? colors.accent : colors.border, backgroundColor: colors.surface },
          ]}>
            <Lock size={16} color={colors.textMuted} strokeWidth={1.5} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={handleEmailSignIn}
              accessibilityLabel="Password"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, loading && styles.btnDisabled, pressed && styles.pressed]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Text style={styles.primaryBtnText}>Sign in</Text>
              <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
            </>
          )}
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            New to QuidSafe?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/signup')}>
            <Text style={[styles.switchLink, { color: colors.accent }]}>Create account</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {isDesktop && <AuthLeftPanel />}

      <View style={styles.rightPanel}>
        <SafeAreaView style={styles.rightSafe} edges={isDesktop ? [] : ['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mobile brand header */}
            {!isDesktop && (
              <View style={styles.mobileBrand}>
                <View style={styles.mobileIcon}>
                  <Shield size={24} color={Colors.electricBlue} strokeWidth={1.5} />
                </View>
                <Text style={[styles.mobileBrandText, { color: colors.text }]}>QuidSafe</Text>
              </View>
            )}

            <View style={styles.formContainer}>{renderForm()}</View>

            {/* Footer */}
            <Text style={[styles.legalText, { color: colors.textMuted }]}>
              By continuing, you agree to the{' '}
              <Text style={[styles.legalLink, { color: colors.textSecondary }]} onPress={() => router.push('/terms')}>Terms</Text>
              {' '}and{' '}
              <Text style={[styles.legalLink, { color: colors.textSecondary }]} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={{ width: 18, height: 18, backgroundColor: Colors.white, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: '#4285F4', lineHeight: 14 }}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  rightSafe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    paddingVertical: 64,
  },

  // Mobile brand
  mobileBrand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginBottom: 48,
  },
  mobileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileBrandText: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },

  // Form container
  formContainer: {
    maxWidth: 400,
    width: '100%' as unknown as number,
    alignSelf: 'center' as const,
  },

  // Typography
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },

  // SSO
  ssoBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
  },
  ssoText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },

  // Divider
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  label: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  labelLink: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.electricBlue,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  textLinkBtn: {
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  textLink: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },

  // Error
  error: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.error,
    marginBottom: 8,
  },

  // Switch
  switchRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  switchText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },
  switchLink: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },

  // Footer
  legalText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textAlign: 'center' as const,
    marginTop: 32,
    maxWidth: 400,
    alignSelf: 'center' as const,
  },
  legalLink: {
    textDecorationLine: 'underline' as const,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

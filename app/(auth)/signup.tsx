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
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Lock, Mail, User, ArrowRight, ArrowLeft, Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { AuthLeftPanel } from '@/components/ui/AuthLeftPanel';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop } = useResponsiveLayout();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const canSubmit = isNameValid && isEmailValid && isPasswordValid;

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
    if (!isLoaded || !signUp || !canSubmit) {
      if (!isNameValid) setError('Please enter your name');
      else if (!isEmailValid) setError('Please enter a valid email address');
      else if (!isPasswordValid) setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const trimmedName = name.trim();
      const [firstName, ...rest] = trimmedName.split(/\s+/);
      const lastName = rest.join(' ') || firstName;

      await signUp.create({
        firstName,
        lastName,
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const errObj = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message = errObj?.errors?.[0]?.longMessage || errObj?.errors?.[0]?.message
        || (err instanceof Error ? err.message : 'Sign up failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, name, email, password, canSubmit, isNameValid, isEmailValid, isPasswordValid]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded || !signUp || !code) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        router.replace('/onboarding');
        return;
      }

      // Status not complete - show exactly what's missing
      const missing = (result.missingFields as string[] | undefined) || [];
      const unverified = (result.unverifiedFields as string[] | undefined) || [];

      if (missing.length > 0) {
        setError(`Missing required field(s): ${missing.join(', ')}. Please start over.`);
      } else if (unverified.length > 0) {
        setError(`Still need to verify: ${unverified.join(', ')}.`);
      } else {
        setError(`Unexpected status: ${result.status}. Please try again.`);
      }
    } catch (err: unknown) {
      const errObj = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message = errObj?.errors?.[0]?.longMessage || errObj?.errors?.[0]?.message
        || (err instanceof Error ? err.message : 'Invalid code');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, setActive, code, router]);

  const renderForm = () => {
    if (pendingVerification) {
      return (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit code to {email}.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Verification code</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Lock size={16} color={colors.textMuted} strokeWidth={1.5} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
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
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, (loading || !code) && styles.btnDisabled, pressed && styles.pressed]}
            onPress={handleVerify}
            disabled={loading || !code}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={styles.primaryBtnText}>Verify & continue</Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.textLinkBtn}
            onPress={() => {
              setPendingVerification(false);
              setCode('');
              setError('');
            }}
          >
            <ArrowLeft size={14} color={colors.accent} strokeWidth={1.5} />
            <Text style={[styles.textLink, { color: colors.accent }]}>Use a different email</Text>
          </Pressable>
        </>
      );
    }

    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start your 14-day free trial. No card required.
        </Text>

        {/* Google SSO */}
        <Pressable
          style={({ pressed }) => [styles.ssoBtn, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}
          onPress={handleGoogleSignUp}
        >
          <GoogleIcon />
          <Text style={[styles.ssoText, { color: colors.text }]}>Continue with Google</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or sign up with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full name</Text>
          <View style={[
            styles.inputWrap,
            { borderColor: nameFocus ? colors.accent : colors.border, backgroundColor: colors.surface },
          ]}>
            <User size={16} color={colors.textMuted} strokeWidth={1.5} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Jane Smith"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
            {isNameValid && <Check size={16} color={Colors.success} strokeWidth={2} />}
          </View>
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
            />
            {isEmailValid && <Check size={16} color={Colors.success} strokeWidth={2} />}
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[
            styles.inputWrap,
            { borderColor: passwordFocus ? colors.accent : colors.border, backgroundColor: colors.surface },
          ]}>
            <Lock size={16} color={colors.textMuted} strokeWidth={1.5} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={handleSignUp}
            />
            {isPasswordValid && <Check size={16} color={Colors.success} strokeWidth={2} />}
          </View>
          {password.length > 0 && password.length < 8 && (
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {8 - password.length} more character{8 - password.length === 1 ? '' : 's'} needed
            </Text>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, loading && styles.btnDisabled, pressed && styles.pressed]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Text style={styles.primaryBtnText}>Create account</Text>
              <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
            </>
          )}
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.switchLink, { color: colors.accent }]}>Sign in</Text>
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
  label: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 6,
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
  helperText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 6,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
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

import { useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

export default function SignupScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = useMemo(() => {
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    return '';
  }, [email]);

  const isSignupValid = !emailError;

  const handleSignUp = async () => {
    if (!isLoaded || !isSignupValid) return;
    setEmailTouched(true);
    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !code) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        router.replace('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {pendingVerification ? 'Check your email' : 'Create your account'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {pendingVerification
            ? `We sent a code to ${email}`
            : 'Start tracking your tax in minutes'}
        </Text>
      </View>

      <View style={styles.form}>
        {!pendingVerification ? (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: emailTouched && emailError
                    ? Colors.error
                    : emailFocused
                    ? Colors.secondary
                    : colors.border,
                  borderWidth: emailFocused ? 2 : 1,
                },
              ]}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                setEmailTouched(true);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {emailTouched && emailError ? (
              <Text style={styles.fieldError}>{emailError}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!isSignupValid || loading) && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleSignUp}
              disabled={!isSignupValid || loading}
              accessibilityRole="button"
              accessibilityLabel="Send verification code"
              accessibilityHint="Tap to send a verification code to your email"
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: codeFocused ? Colors.secondary : colors.border,
                  borderWidth: codeFocused ? 2 : 1,
                },
              ]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              onFocus={() => setCodeFocused(true)}
              onBlur={() => setCodeFocused(false)}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={handleVerify}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Verify and continue"
              accessibilityHint="Tap to verify your email code and continue"
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} accessibilityRole="link" accessibilityLabel="Back to login">
          <Text style={styles.backLink}>Back to login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    gap: Spacing.md + 4,
  },
  input: {
    borderRadius: BorderRadius.input,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    ...Shadows.soft,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadows.medium,
  },
  buttonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  error: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  fieldError: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  backLink: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.primary,
  },
});

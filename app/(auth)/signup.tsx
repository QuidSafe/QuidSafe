import { useState, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, Animated } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
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

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(24)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeSlide = (fade: Animated.Value, slide: Animated.Value, dur: number) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: dur, useNativeDriver: true }),
      ]);

    fadeSlide(headerFade, headerSlide, 500).start();

    Animated.sequence([
      Animated.delay(300),
      fadeSlide(formFade, formSlide, 450),
    ]).start();

    Animated.sequence([
      Animated.delay(550),
      Animated.timing(footerFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

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
    <View style={s.root}>
      <LinearGradient
        colors={['#080C18', '#0C1222', '#142044', '#0C1222', '#080C18']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric glows */}
      <View style={s.glowGold} />
      <View style={s.glowBlue} />

      <SafeAreaView style={s.safe}>
        {/* Header */}
        <Animated.View style={[s.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Text style={s.title} accessibilityRole="header">
            {pendingVerification ? 'Check your email' : 'Create your account'}
          </Text>
          <View style={s.accentBar} />
          <Text style={s.subtitle}>
            {pendingVerification
              ? `We sent a code to ${email}`
              : 'Start tracking your tax in minutes'}
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[s.form, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>
          {!pendingVerification ? (
            <>
              <View style={[
                s.inputWrap,
                emailFocused && s.inputFocused,
                emailTouched && emailError ? s.inputError : null,
              ]}>
                <FontAwesome name="envelope-o" size={15} color="rgba(255,255,255,0.35)" style={{ marginRight: 12 }} />
                <TextInput
                  style={s.input}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.3)"
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
              </View>
              {emailTouched && emailError ? (
                <Text style={s.fieldError}>{emailError}</Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  s.ctaBtn,
                  (!isSignupValid || loading) && s.ctaBtnDisabled,
                  pressed && s.pressed,
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
                  <LinearGradient
                    colors={['#D4A017', '#CA8A04', '#A16207']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.ctaGradient}
                  >
                    <Text style={s.ctaText}>Send Verification Code</Text>
                  </LinearGradient>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={[s.inputWrap, codeFocused && s.inputFocused]}>
                <FontAwesome name="lock" size={16} color="rgba(255,255,255,0.35)" style={{ marginRight: 12 }} />
                <TextInput
                  style={s.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={code}
                  onChangeText={setCode}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Pressable
                style={({ pressed }) => [s.ctaBtn, pressed && s.pressed]}
                onPress={handleVerify}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Verify and continue"
                accessibilityHint="Tap to verify your email code and continue"
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <LinearGradient
                    colors={['#D4A017', '#CA8A04', '#A16207']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.ctaGradient}
                  >
                    <Text style={s.ctaText}>Verify & Continue</Text>
                  </LinearGradient>
                )}
              </Pressable>
            </>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[s.footer, { opacity: footerFade }]}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="link"
            accessibilityLabel="Back to login"
            style={({ pressed }) => [pressed && s.pressed]}
          >
            <Text style={s.backLink}>
              <FontAwesome name="arrow-left" size={12} color={Colors.accent} />{' '}
              Back to login
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080C18',
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg + 4,
    justifyContent: 'center',
  },

  // Atmospheric glows
  glowGold: {
    position: 'absolute',
    top: '15%',
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(202, 138, 4, 0.08)',
  },
  glowBlue: {
    position: 'absolute',
    bottom: '20%',
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(30, 58, 138, 0.12)',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 32,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 14,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Form
  form: {
    gap: 16,
    marginBottom: 32,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 15,
  },
  inputFocused: {
    borderColor: 'rgba(202, 138, 4, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputError: {
    borderColor: 'rgba(220, 38, 38, 0.5)',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.manrope.regular,
    fontSize: 16,
    color: Colors.white,
    padding: 0,
  },

  // CTA
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  ctaGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    fontFamily: Fonts.manrope.extraBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },

  error: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  fieldError: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 12,
    color: Colors.error,
    marginTop: -8,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  backLink: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 14,
    color: Colors.accent,
  },
});

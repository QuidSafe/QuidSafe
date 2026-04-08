import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Wand2, PoundSterling, Lock, ArrowLeft, ArrowRight, EyeOff, Shield, Calendar, Check, Info, CheckCircle, Landmark } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { api } from '@/lib/api';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  WelcomeIllustration,
  BusinessIllustration,
  BankIllustration,
} from '@/components/ui/OnboardingIllustrations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_SLIDE_WIDTH = 480;
const TOTAL_STEPS = 3;

/* ------------------------------------------------------------------ */
/*  Progress Dots                                                      */
/* ------------------------------------------------------------------ */
function ProgressDots({ current }: { current: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === current ? 24 : 8,
              backgroundColor:
                i === current
                  ? Colors.accent
                  : i < current
                  ? Colors.accent + '60'
                  : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Welcome                                                   */
/* ------------------------------------------------------------------ */
function StepWelcome() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Set up in 2 minutes badge */}
      <View style={[styles.setupTimeBadge, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
        <Clock size={12} color={Colors.accent} strokeWidth={1.5} style={{ marginRight: Spacing.xs }} />
        <Text style={[styles.setupTimeBadgeText, { color: Colors.accent }]}>Set up in 2 minutes</Text>
      </View>

      {/* Animated illustration — shield with pound sign */}
      <View style={styles.illustrationArea}>
        <WelcomeIllustration />
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>
        Welcome to QuidSafe
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your personal tax assistant for UK sole traders
      </Text>

      {/* Feature highlights */}
      <View style={styles.featureList}>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.secondary + '18' }]}>
            <Wand2 size={16} color={Colors.secondary} strokeWidth={1.5} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>AI-powered categorisation</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Transactions sorted automatically
            </Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.accent + '18' }]}>
            <PoundSterling size={16} color={Colors.accent} strokeWidth={1.5} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Know what to set aside</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Plain English tax estimates each month
            </Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.success + '18' }]}>
            <Lock size={16} color={Colors.success} strokeWidth={1.5} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Bank-grade security</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              AES-256 encryption, GDPR compliant
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Business Info                                             */
/* ------------------------------------------------------------------ */
function StepBusinessInfo({
  businessName,
  onBusinessNameChange,
  disclaimerChecked,
  onDisclaimerChange,
}: {
  businessName: string;
  onBusinessNameChange: (val: string) => void;
  disclaimerChecked: boolean;
  onDisclaimerChange: (val: boolean) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.illustrationArea}>
        <BusinessIllustration />
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>
        About your business
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tell us a bit about your sole trader business so we can personalise your experience.
      </Text>

      {/* Business name input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Business name</Text>
        <View
          style={[
            styles.textInputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="e.g. Smith Consulting"
            placeholderTextColor={colors.textSecondary}
            value={businessName}
            onChangeText={onBusinessNameChange}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Tax year info */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Tax year</Text>
        <View
          style={[
            styles.infoBox,
            { backgroundColor: Colors.secondary + '0A', borderColor: Colors.secondary + '20' },
          ]}
        >
          <Calendar size={16} color={Colors.secondary} strokeWidth={1.5} style={{ marginRight: Spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoBoxTitle, { color: colors.text }]}>
              6 April 2025 {'\u2013'} 5 April 2026
            </Text>
            <Text style={[styles.infoBoxSub, { color: colors.textSecondary }]}>
              Automatically set to the current UK tax year
            </Text>
          </View>
        </View>
      </View>

      {/* Disclaimer checkbox */}
      <Pressable
        style={styles.checkboxRow}
        onPress={() => onDisclaimerChange(!disclaimerChecked)}
      >
        <View
          style={[
            styles.checkbox,
            disclaimerChecked && styles.checkboxChecked,
            { borderColor: disclaimerChecked ? Colors.accent : colors.border },
          ]}
        >
          {disclaimerChecked && (
            <Check size={12} color={Colors.white} strokeWidth={1.5} />
          )}
        </View>
        <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
          I understand QuidSafe provides estimates, not financial advice
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Connect Bank                                              */
/* ------------------------------------------------------------------ */
function StepConnectBank() {
  const { colors } = useTheme();
  const [connecting, setConnecting] = useState(false);

  const handleConnectBank = async () => {
    try {
      setConnecting(true);
      const { url } = await api.getConnectUrl(Platform.OS !== 'web' ? 'native' : undefined);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (_err) {
      Alert.alert('Connection failed', 'Could not connect to your bank. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Animated bank illustration */}
      <View style={styles.illustrationArea}>
        <BankIllustration />
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>
        Connect your bank
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Securely link via Open Banking to auto-import transactions
      </Text>

      {/* Trust badges */}
      <View style={styles.trustBadges}>
        {[
          { Icon: EyeOff, text: 'Read-only access' },
          { Icon: Shield, text: 'AES-256 encrypted' },
          { Icon: Shield, text: 'UK servers' },
        ].map((badge) => (
          <View key={badge.text} style={[styles.trustBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <badge.Icon size={14} color={Colors.success} strokeWidth={1.5} style={{ marginRight: Spacing.xs }} />
            <Text style={[styles.trustBadgeText, { color: colors.textSecondary }]}>{badge.text}</Text>
          </View>
        ))}
      </View>

      {/* Supported banks strip */}
      <View style={styles.bankStripContainer}>
        <Text style={[styles.bankStripLabel, { color: colors.textSecondary }]}>Supported banks:</Text>
        <View style={styles.bankStripRow}>
          {['Barclays', 'HSBC', 'Lloyds', 'NatWest', 'Monzo', 'Starling', 'Revolut', 'Nationwide'].map((bank, i) => (
            <View key={bank} style={[styles.bankPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.bankPillText, { color: colors.textSecondary }]}>{bank}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Connect button */}
      <Pressable
        style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
        onPress={handleConnectBank}
        disabled={connecting}
      >
        <View style={[styles.ctaGradient, { backgroundColor: '#0066FF' }]}>
          <Landmark size={16} color={Colors.white} strokeWidth={1.5} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.ctaButtonText}>
            {connecting ? 'Connecting...' : 'Connect Bank'}
          </Text>
        </View>
      </Pressable>

      {/* Info note */}
      <View style={[styles.infoNote, { borderColor: Colors.secondary + '20', backgroundColor: Colors.secondary + '08' }]}>
        <Info size={14} color={Colors.secondary} strokeWidth={1.5} style={{ marginRight: Spacing.sm, marginTop: 2 }} />
        <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
          We use Open Banking — we can see transactions but never move money, see your PIN, or access your login details.
        </Text>
      </View>

      {/* HMRC Recognised badge */}
      <View style={[styles.hmrcBadge, { backgroundColor: Colors.success + '10', borderColor: Colors.success + '25' }]}>
        <CheckCircle size={14} color={Colors.success} strokeWidth={1.5} style={{ marginRight: Spacing.xs }} />
        <Text style={[styles.hmrcBadgeText, { color: Colors.success }]}>HMRC Recognised for MTD</Text>
      </View>
    </ScrollView>
  );
}

/* ================================================================== */
/*  Main Screen                                                       */
/* ================================================================== */
export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Platform.OS === 'web' ? Math.min(windowWidth, MAX_SLIDE_WIDTH) : SCREEN_WIDTH;

  // Step 2 form state
  const [businessName, setBusinessName] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const animateTo = useCallback(
    (nextStep: number) => {
      Animated.spring(slideAnim, {
        toValue: -nextStep * slideWidth,
        useNativeDriver: true,
        tension: 80,
        friction: 14,
      }).start();
      setStep(nextStep);
    },
    [slideAnim, slideWidth]
  );

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTo(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTo(step - 1);
    }
  };

  const handleSkip = async () => {
    await api.completeOnboarding().catch(() => {});
    router.replace('/(tabs)');
  };

  const canContinueStep2 = disclaimerChecked;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.innerContainer, Platform.OS === 'web' && { maxWidth: MAX_SLIDE_WIDTH, alignSelf: 'center' as const, width: '100%' as unknown as number }]}>
      {/* Top bar: back button + dots */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <ProgressDots current={step} />
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Slides */}
      <Animated.View
        style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={{ width: slideWidth }}>
          <StepWelcome />
        </View>
        <View style={{ width: slideWidth }}>
          <StepBusinessInfo
            businessName={businessName}
            onBusinessNameChange={setBusinessName}
            disclaimerChecked={disclaimerChecked}
            onDisclaimerChange={setDisclaimerChecked}
          />
        </View>
        <View style={{ width: slideWidth }}>
          <StepConnectBank />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {step === 0 && (
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
            onPress={handleNext}
          >
            <View style={[styles.ctaGradient, { backgroundColor: '#0066FF' }]}>
              <Text style={styles.ctaButtonText}>Get Started</Text>
              <ArrowRight size={14} color={Colors.white} strokeWidth={1.5} style={{ marginLeft: Spacing.sm }} />
            </View>
          </Pressable>
        )}

        {step === 1 && (
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              !canContinueStep2 && styles.ctaButtonDisabled,
              pressed && canContinueStep2 && styles.pressed,
            ]}
            onPress={handleNext}
            disabled={!canContinueStep2}
          >
            <View style={[styles.ctaGradient, { backgroundColor: '#0066FF' }]}>
              <Text style={styles.ctaButtonText}>Continue</Text>
              <ArrowRight size={14} color={Colors.white} strokeWidth={1.5} style={{ marginLeft: Spacing.sm }} />
            </View>
          </Pressable>
        )}

        {step === 2 && (
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip for now
            </Text>
          </Pressable>
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  /* Slides */
  slides: {
    flex: 1,
    flexDirection: 'row',
  },
  slideScroll: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },

  /* Illustration */
  illustrationArea: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  illustrationRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  illustrationRingMiddle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  illustrationCircleBlue: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  poundOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  poundText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
  decoDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  decoDotTopRight: {
    top: 18,
    right: 12,
  },
  decoDotBottomLeft: {
    bottom: 22,
    left: 8,
  },
  decoSmallDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  decoSmallDotTop: {
    top: 8,
    left: 50,
  },
  decoSmallDotRight: {
    right: 4,
    bottom: 60,
  },

  /* Bank illustration extras */
  bankDecoDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  bankDecoDot1: {
    top: 20,
    right: 16,
  },
  bankDecoDot2: {
    bottom: 24,
    left: 14,
  },

  /* Typography */
  heading: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  /* Step 1 feature list */
  featureList: {
    alignSelf: 'stretch',
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 19,
  },

  /* Step 2 icon */
  stepIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },

  /* Step 2 form */
  formGroup: {
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  textInputContainer: {
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    padding: 0,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    padding: Spacing.md,
  },
  infoBoxTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  infoBoxSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 18,
  },

  /* Checkbox */
  checkboxRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 21,
  },

  /* Step 3 trust badges */
  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  trustBadgeText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
  },

  /* Step 3 info note */
  infoNote: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoNoteText: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 20,
  },

  /* Set up time badge */
  setupTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  setupTimeBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },

  /* Bank strip */
  bankStripContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  bankStripLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  bankStripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  bankPill: {
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  bankPillText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
  },

  /* HMRC badge */
  hmrcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginTop: Spacing.lg,
  },
  hmrcBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },

  /* CTA Button (gold gradient) */
  ctaButton: {
    borderRadius: BorderRadius.button,
    overflow: 'hidden' as const,
    width: '100%',
    ...Shadows.medium,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: Colors.white,
  },

  /* Skip text */
  skipText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    paddingVertical: Spacing.sm,
    textDecorationLine: 'underline',
  },

  /* Footer */
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

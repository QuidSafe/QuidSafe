import { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { Card } from '@/components/ui/Card';
// useApiToken is now called in the root layout
import { api } from '@/lib/api';
import * as Linking from 'expo-linking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANKS = [
  { name: 'Monzo', initials: 'M', color: '#FF4B4B' },
  { name: 'Starling', initials: 'S', color: '#7433FF' },
  { name: 'Halifax', initials: 'H', color: '#006BBF' },
  { name: 'HSBC', initials: 'H', color: '#DB0011' },
  { name: 'NatWest', initials: 'N', color: '#42145F' },
  { name: 'Barclays', initials: 'B', color: '#00AEEF' },
];

const TRUST_PILLS = [
  'AES-256 encryption',
  'UK servers',
  'AI anonymised',
  'GDPR',
];

/* ------------------------------------------------------------------ */
/*  Animated Step Dots                                                 */
/* ------------------------------------------------------------------ */
function StepDots({ current, total }: { current: number; total: number }) {
  const widths = useRef(
    Array.from({ length: total }).map(
      (_, i) => new Animated.Value(i === 0 ? 24 : 8)
    )
  ).current;

  useEffect(() => {
    const anims = widths.map((w, i) =>
      Animated.spring(w, {
        toValue: i === current ? 24 : 8,
        useNativeDriver: false,
        tension: 120,
        friction: 14,
      })
    );
    Animated.parallel(anims).start();
  }, [current, widths]);

  return (
    <View style={styles.dotsRow}>
      {widths.map((w, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: w,
                backgroundColor: isActive
                  ? Colors.secondary
                  : isDone
                  ? Colors.success
                  : Colors.grey[300],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Counting number animation                                          */
/* ------------------------------------------------------------------ */
function CountingNumber({ target }: { target: number }) {
  const { colors } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('£0');

  useEffect(() => {
    animValue.setValue(0);
    const listener = animValue.addListener(({ value }) => {
      const num = Math.round(value);
      setDisplay(`£${num.toLocaleString('en-GB')}`);
    });

    Animated.timing(animValue, {
      toValue: target,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animValue.removeListener(listener);
  }, [target, animValue]);

  return (
    <View style={styles.countingContainer}>
      <Text style={[styles.countingNumber, { color: Colors.accent }]}>
        {display}
      </Text>
      <Text style={[styles.countingSub, { color: colors.textSecondary }]}>
        That's how much the average sole trader saves
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Staggered Feature Card                                             */
/* ------------------------------------------------------------------ */
function AnimatedFeatureCard({
  badgeColor,
  iconName,
  title,
  description,
  delay,
}: {
  badgeColor: string;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
  delay: number;
}) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, translateY, delay]);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY }] }}
    >
      <Card style={styles.featureCard}>
        <View style={[styles.featureBadge, { backgroundColor: badgeColor + '18' }]}>
          <FontAwesome name={iconName} size={18} color={badgeColor} />
        </View>
        <View style={styles.featureCardText}>
          <Text style={[styles.featureCardTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.featureCardDesc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Welcome                                                  */
/* ------------------------------------------------------------------ */
function StepWelcome() {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero icon */}
      <View style={styles.heroIconNavy}>
        <FontAwesome name="shield" size={28} color={Colors.white} />
      </View>

      <Text style={styles.appTitle}>QuidSafe</Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Everything a sole trader needs to run their business. Tax, invoices,
        expenses — sorted.
      </Text>

      {/* Animated counting number */}
      <CountingNumber target={2847} />

      <Text style={styles.subSubtitle}>
        Whether you earn £15k or £150k — know exactly what you owe.
      </Text>

      {/* Testimonial card */}
      <Card style={styles.testimonialCard}>
        <View style={styles.testimonialBorder} />
        <View style={styles.testimonialInner}>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <FontAwesome key={i} name="star" size={14} color={Colors.accent} />
            ))}
          </View>
          <Text style={[styles.testimonialQuote, { color: colors.text }]}>
            {'"'}Finally an app that tells me what to set aside each month. I slept
            better the first night I used it.{'"'}
          </Text>
          <Text style={styles.testimonialAttribution}>
            — Sarah T., freelance designer
          </Text>
        </View>
      </Card>

      {/* Feature cards — stagger in */}
      <View style={styles.featureCards}>
        <AnimatedFeatureCard
          badgeColor={Colors.secondary}
          iconName="magic"
          title="AI-powered categorisation"
          description="Anonymised AI sorts your income vs spending automatically — no manual tagging."
          delay={200}
        />
        <AnimatedFeatureCard
          badgeColor={Colors.accent}
          iconName="commenting"
          title="Plain English tax"
          description={'"Set aside £648 this month." No jargon, no spreadsheets.'}
          delay={300}
        />
        <AnimatedFeatureCard
          badgeColor={Colors.success}
          iconName="file-text-o"
          title="MTD + Invoices + Expenses"
          description="Submit to HMRC, send invoices, and track expenses — all in one place."
          delay={400}
        />
      </View>

      {/* Price box */}
      <Card style={styles.priceBox}>
        <Text style={styles.priceMain}>£9.99/mo</Text>
        <Text style={styles.priceSub}>or £89.99/yr — save 25%</Text>
      </Card>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Pulsing Connect Button                                             */
/* ------------------------------------------------------------------ */
function PulsingButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'stretch' }}>
      <Pressable
        style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}
        onPress={onPress}
        disabled={disabled}
      >
        <FontAwesome name="bank" size={16} color={Colors.white} style={{ marginRight: Spacing.sm }} />
        <Text style={styles.connectButtonText}>
          {disabled ? 'Connecting...' : 'Connect your bank'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Bank Connect                                             */
/* ------------------------------------------------------------------ */
function StepBankConnect({ onBankConnected }: { onBankConnected?: () => void }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnectBank = async () => {
    try {
      setConnecting(true);
      const { url } = await api.getConnectUrl();
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
      // After returning from TrueLayer, advance to step 3
      onBankConnected?.();
    } catch (err) {
      Alert.alert('Connection failed', 'Could not connect to your bank. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const filtered = BANKS.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero icon */}
      <View style={styles.heroIconBlue}>
        <FontAwesome name="bank" size={26} color={Colors.secondary} />
      </View>

      <Text style={styles.stepTitle}>Connect your bank</Text>

      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        We use Open Banking to securely sync your transactions. It&apos;s read-only —
        we can never move money or see your PIN.
      </Text>

      {/* Info card */}
      <Card style={styles.infoCardBlue}>
        <View style={styles.infoCardBlueBorder} />
        <View style={styles.infoCardInner}>
          <FontAwesome
            name="info-circle"
            size={16}
            color={Colors.secondary}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
            Open Banking is read-only. We can see transactions but never move
            money, see your PIN, or access your login details.
          </Text>
        </View>
      </Card>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FontAwesome
          name="search"
          size={14}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search your bank..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Bank list */}
      <View style={styles.bankList}>
        {filtered.map((bank) => (
          <Pressable key={bank.name} style={[styles.bankRow, { backgroundColor: colors.surface }]} onPress={handleConnectBank} disabled={connecting}>
            <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
              <Text style={styles.bankInitials}>{bank.initials}</Text>
            </View>
            <Text style={[styles.bankName, { color: colors.text }]}>{bank.name}</Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      {/* Pulsing connect button */}
      <View style={{ height: Spacing.lg }} />
      <PulsingButton onPress={handleConnectBank} disabled={connecting} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Confetti particle                                                  */
/* ------------------------------------------------------------------ */
function ConfettiParticle({ delay, startX }: { delay: number; startX: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: -80,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, startX, opacity, translateY, translateX, scale]);

  return (
    <Animated.View
      style={[
        styles.confettiDot,
        {
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Checkmark                                                 */
/* ------------------------------------------------------------------ */
function AnimatedCheckmark() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.checkmarkCircle,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <FontAwesome name="check" size={40} color={Colors.white} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — All Set                                                  */
/* ------------------------------------------------------------------ */
function StepAllSet() {
  const { colors } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title scale-up animation
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Progress bar loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [progressAnim, titleScale, titleOpacity]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Confetti particles — scattered positions
  const confettiData = [
    { delay: 400, startX: -30 },
    { delay: 500, startX: 20 },
    { delay: 600, startX: -50 },
    { delay: 700, startX: 40 },
    { delay: 550, startX: -10 },
    { delay: 650, startX: 55 },
    { delay: 450, startX: -40 },
    { delay: 750, startX: 15 },
  ];

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Confetti particles */}
      <View style={styles.confettiContainer}>
        {confettiData.map((c, i) => (
          <ConfettiParticle key={i} delay={c.delay} startX={c.startX} />
        ))}
      </View>

      {/* Animated checkmark */}
      <AnimatedCheckmark />

      <Animated.Text
        style={[
          styles.stepTitle,
          {
            color: Colors.success,
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          },
        ]}
      >
        You&apos;re all set!
      </Animated.Text>

      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        We&apos;re syncing your transactions now. This usually takes about 30 seconds.
      </Text>

      {/* Syncing card */}
      <Card style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <FontAwesome name="refresh" size={16} color={Colors.secondary} />
          <Text style={[styles.syncTitle, { color: colors.text }]}>Syncing transactions...</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>
        <Text style={styles.syncSubtext}>
          This usually takes about 30 seconds
        </Text>
      </Card>

      {/* Security banner */}
      <Card style={styles.securityBanner}>
        <FontAwesome name="shield" size={18} color={Colors.success} />
        <View style={styles.securityTextWrap}>
          <Text style={[styles.securityTitle, { color: colors.text }]}>Your data is safe</Text>
          <Text style={styles.securityDesc}>
            AES-256 encryption · UK servers · GDPR compliant
          </Text>
        </View>
      </Card>
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

  const animateTo = useCallback(
    (nextStep: number) => {
      Animated.spring(slideAnim, {
        toValue: -nextStep * SCREEN_WIDTH,
        useNativeDriver: true,
        tension: 80,
        friction: 14,
      }).start();
      setStep(nextStep);
    },
    [slideAnim]
  );

  const handleNext = async () => {
    if (step < 2) {
      animateTo(step + 1);
    } else {
      await api.completeOnboarding().catch(() => {});
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    if (step === 1) {
      // Skip bank connect, go to step 3
      animateTo(2);
    } else {
      await api.completeOnboarding().catch(() => {});
      router.replace('/(tabs)');
    }
  };

  const handleFinish = async () => {
    await api.completeOnboarding().catch(() => {});
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Subtle gradient overlay */}
      <View style={[styles.gradientOverlay, { backgroundColor: colors.background }]}>
        <View style={styles.gradientTop} />
      </View>

      {/* Slides */}
      <Animated.View
        style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Step 1 */}
        <View style={{ width: SCREEN_WIDTH }}>
          <StepWelcome />
        </View>
        {/* Step 2 */}
        <View style={{ width: SCREEN_WIDTH }}>
          <StepBankConnect onBankConnected={() => animateTo(2)} />
        </View>
        {/* Step 3 */}
        <View style={{ width: SCREEN_WIDTH }}>
          <StepAllSet />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <StepDots current={step} total={3} />

        {step === 0 && (
          <>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
              onPress={handleNext}
            >
              <FontAwesome
                name="shield"
                size={16}
                color={Colors.white}
                style={styles.ctaIcon}
              />
              <Text style={styles.ctaButtonText}>Start 14-day free trial</Text>
            </Pressable>
            <Text style={styles.smallText}>
              No card required · Cancel anytime
            </Text>
            <View style={styles.trustPills}>
              {TRUST_PILLS.map((pill) => (
                <View key={pill} style={styles.trustPill}>
                  <FontAwesome
                    name="check-circle"
                    size={10}
                    color={Colors.success}
                    style={styles.trustPillIcon}
                  />
                  <Text style={styles.trustPillText}>{pill}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSkip}
            >
              <Text style={styles.ghostButtonText}>Skip for now</Text>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={handleFinish}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  /* Layout */
  container: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Colors.secondary,
    opacity: 0.03,
  },
  slides: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 1,
  },
  slideScroll: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },

  /* Step Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  /* Hero icons */
  heroIconNavy: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroIconBlue: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: Colors.secondary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroIconGreen: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: Colors.success + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  /* Counting number animation */
  countingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  countingNumber: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    letterSpacing: -1,
    marginBottom: Spacing.xs,
  },
  countingSub: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Step 1 — Welcome */
  appTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  subSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: Colors.grey[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  /* Testimonial */
  testimonialCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  testimonialBorder: {
    width: 3,
    backgroundColor: Colors.accent,
  },
  testimonialInner: {
    flex: 1,
    padding: Spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: Spacing.xs,
  },
  testimonialQuote: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  testimonialAttribution: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: Colors.grey[500],
  },

  /* Feature cards */
  featureCards: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureBadge: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardText: {
    flex: 1,
  },
  featureCardTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  featureCardDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },

  /* Price box */
  priceBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  priceMain: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.primary,
  },
  priceSub: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.grey[500],
    marginTop: 2,
  },

  /* Step titles (shared by step 2 & 3) */
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },

  /* Step 2 — Bank Connect */
  infoCardBlue: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  infoCardBlueBorder: {
    width: 3,
    backgroundColor: Colors.secondary,
  },
  infoCardInner: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoCardText: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },

  searchContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    padding: 0,
  },

  bankList: {
    alignSelf: 'stretch',
    gap: Spacing.xs,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  bankLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bankInitials: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
  bankName: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },

  /* Connect button (pulsing) */
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    ...Shadows.medium,
  },
  connectButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: Colors.white,
  },

  /* Step 3 — All Set */
  confettiContainer: {
    position: 'relative',
    height: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  syncCard: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  syncTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grey[200],
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  syncSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.grey[500],
  },

  securityBanner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.success + '0D',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  securityDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.grey[500],
  },

  /* Footer */
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    zIndex: 1,
  },

  /* CTA button (gold) — Step 1 */
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    width: '100%',
    ...Shadows.medium,
  },
  ctaIcon: {
    marginRight: Spacing.sm,
  },
  ctaButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
  smallText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.grey[500],
    marginTop: Spacing.sm,
  },

  /* Trust pills */
  trustPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grey[100],
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  trustPillIcon: {
    marginRight: 4,
  },
  trustPillText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: Colors.grey[600],
  },

  /* Ghost button — Step 2 */
  ghostButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey[300],
  },
  ghostButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.grey[600],
  },

  /* Primary button — Step 3 */
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    width: '100%',
    alignItems: 'center',
    ...Shadows.medium,
  },
  primaryButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: Colors.white,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

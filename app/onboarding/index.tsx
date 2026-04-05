import { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { useApiToken } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANKS = [
  { name: 'Monzo', initials: 'M', color: '#FF5C57' },
  { name: 'Starling', initials: 'S', color: '#7C3AED' },
  { name: 'Halifax', initials: 'H', color: '#0F172A' },
  { name: 'HSBC', initials: 'H', color: '#1E293B' },
  { name: 'NatWest', initials: 'N', color: '#6D28D9' },
];

const TRUST_PILLS = [
  'AES-256 encryption',
  'UK servers',
  'AI anonymised',
  'GDPR',
];

/* ------------------------------------------------------------------ */
/*  Step Dots                                                         */
/* ------------------------------------------------------------------ */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isDone && styles.dotDone,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Welcome                                                  */
/* ------------------------------------------------------------------ */
function StepWelcome() {
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

      <Text style={styles.subtitle}>
        Everything a sole trader needs to run their business. Tax, invoices,
        expenses — sorted.
      </Text>

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
          <Text style={styles.testimonialQuote}>
            {'"'}Finally an app that tells me what to set aside each month. I slept
            better the first night I used it.{'"'}
          </Text>
          <Text style={styles.testimonialAttribution}>
            — Sarah T., freelance designer
          </Text>
        </View>
      </Card>

      {/* Feature cards */}
      <View style={styles.featureCards}>
        <FeatureCard
          badgeColor={Colors.secondary}
          iconName="magic"
          title="AI-powered categorisation"
          description="Anonymised AI sorts your income vs spending automatically — no manual tagging."
        />
        <FeatureCard
          badgeColor={Colors.accent}
          iconName="commenting"
          title="Plain English tax"
          description={'"Set aside £648 this month." No jargon, no spreadsheets.'}
        />
        <FeatureCard
          badgeColor={Colors.success}
          iconName="file-text-o"
          title="MTD + Invoices + Expenses"
          description="Submit to HMRC, send invoices, and track expenses — all in one place."
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

function FeatureCard({
  badgeColor,
  iconName,
  title,
  description,
}: {
  badgeColor: string;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
}) {
  return (
    <Card style={styles.featureCard}>
      <View style={[styles.featureBadge, { backgroundColor: badgeColor + '18' }]}>
        <FontAwesome name={iconName} size={18} color={badgeColor} />
      </View>
      <View style={styles.featureCardText}>
        <Text style={styles.featureCardTitle}>{title}</Text>
        <Text style={styles.featureCardDesc}>{description}</Text>
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Bank Connect                                             */
/* ------------------------------------------------------------------ */
function StepBankConnect() {
  const [search, setSearch] = useState('');

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

      <Text style={styles.stepDescription}>
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
          <Text style={styles.infoCardText}>
            Open Banking is read-only. We can see transactions but never move
            money, see your PIN, or access your login details.
          </Text>
        </View>
      </Card>

      {/* Search */}
      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={14}
          color={Colors.grey[400]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your bank..."
          placeholderTextColor={Colors.grey[400]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Bank list */}
      <View style={styles.bankList}>
        {filtered.map((bank) => (
          <Pressable key={bank.name} style={styles.bankRow}>
            <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
              <Text style={styles.bankInitials}>{bank.initials}</Text>
            </View>
            <Text style={styles.bankName}>{bank.name}</Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={Colors.grey[400]}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — All Set                                                  */
/* ------------------------------------------------------------------ */
function StepAllSet() {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView
      style={styles.slideScroll}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero icon */}
      <View style={styles.heroIconGreen}>
        <FontAwesome name="check" size={28} color={Colors.success} />
      </View>

      <Text style={[styles.stepTitle, { color: Colors.success }]}>
        You&apos;re all set
      </Text>

      <Text style={styles.stepDescription}>
        We&apos;re syncing your transactions now. This usually takes about 30 seconds.
      </Text>

      {/* Syncing card */}
      <Card style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <FontAwesome name="refresh" size={16} color={Colors.secondary} />
          <Text style={styles.syncTitle}>Syncing transactions...</Text>
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
          <Text style={styles.securityTitle}>Your data is safe</Text>
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
  useApiToken();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (nextStep: number) => {
    Animated.timing(slideAnim, {
      toValue: -nextStep * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setStep(nextStep);
  };

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
    <SafeAreaView style={styles.container}>
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
          <StepBankConnect />
        </View>
        {/* Step 3 */}
        <View style={{ width: SCREEN_WIDTH }}>
          <StepAllSet />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
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
    backgroundColor: Colors.light.background,
  },
  slides: {
    flex: 1,
    flexDirection: 'row',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grey[300],
  },
  dotActive: {
    width: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
  },
  dotDone: {
    backgroundColor: Colors.success,
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
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
    marginBottom: 2,
  },
  featureCardDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },

  searchContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.text,
    padding: 0,
  },

  bankList: {
    alignSelf: 'stretch',
    gap: Spacing.xs,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  bankLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bankInitials: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
  bankName: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: Colors.light.text,
  },

  /* Step 3 — All Set */
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
    color: Colors.light.text,
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
    color: Colors.light.text,
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
    borderTopColor: Colors.grey[200],
    backgroundColor: Colors.light.background,
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

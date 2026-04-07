import { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';


// ─── Data ────────────────────────────────────────────────
const STATS = [
  { value: '5.4M', label: 'UK sole traders (ONS)' },
  { value: 'Apr 2026', label: 'MTD deadline for £50K+ income' },
  { value: '£7.99', label: 'per month, everything included' },
  { value: '2 min', label: 'to connect and get started' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect your bank',
    description: 'Link your accounts in seconds via Open Banking. Read-only — we never move your money.',
    icon: '1',
  },
  {
    step: '02',
    title: 'We categorise everything',
    description: 'AI auto-categorises every transaction. No manual entry, no spreadsheets, no guessing.',
    icon: '2',
  },
  {
    step: '03',
    title: 'Know what to set aside',
    description: 'See exactly what you owe HMRC in real time. Income Tax, National Insurance — sorted.',
    icon: '3',
  },
];

const FEATURES = [
  {
    icon: 'AI',
    title: 'AI Categorisation',
    description: 'Every transaction auto-categorised by AI. No more "is this an allowable expense?" guessing.',
    gradient: ['rgba(202,138,4,0.15)', 'rgba(202,138,4,0.05)'] as const,
    iconBg: 'rgba(202,138,4,0.2)',
  },
  {
    icon: '£',
    title: 'Tax Set-Aside Calculator',
    description: 'Know your Income Tax and National Insurance in real time — not as a surprise in January.',
    gradient: ['rgba(22,163,74,0.15)', 'rgba(22,163,74,0.05)'] as const,
    iconBg: 'rgba(22,163,74,0.2)',
  },
  {
    icon: 'Q',
    title: 'MTD Quarterly Submissions',
    description: 'Submit to HMRC directly from the app. Making Tax Digital compliant from day one.',
    gradient: ['rgba(30,58,138,0.2)', 'rgba(30,58,138,0.05)'] as const,
    iconBg: 'rgba(30,58,138,0.3)',
  },
  {
    icon: 'OB',
    title: 'Open Banking Integration',
    description: 'Connect your existing bank accounts. No new accounts needed. FCA regulated via TrueLayer.',
    gradient: ['rgba(148,163,184,0.1)', 'rgba(148,163,184,0.03)'] as const,
    iconBg: 'rgba(148,163,184,0.15)',
  },
  {
    icon: 'INV',
    title: 'Professional Invoices',
    description: 'Create, send, and track invoices. Know when you have been paid — all in one place.',
    gradient: ['rgba(202,138,4,0.1)', 'rgba(30,58,138,0.05)'] as const,
    iconBg: 'rgba(202,138,4,0.15)',
  },
  {
    icon: 'CSV',
    title: 'Full Data Export',
    description: 'Download everything as CSV anytime. Your data always belongs to you.',
    gradient: ['rgba(148,163,184,0.1)', 'rgba(148,163,184,0.02)'] as const,
    iconBg: 'rgba(148,163,184,0.12)',
  },
];

const TRUST_ITEMS = [
  { icon: 'FCA', label: 'FCA Regulated', sublabel: 'Open Banking via TrueLayer' },
  { icon: 'AES', label: 'AES-256 Encryption', sublabel: 'Bank-grade security' },
  { icon: 'MTD', label: 'HMRC Compliant', sublabel: 'Making Tax Digital ready' },
  { icon: 'R/O', label: 'Read-Only Access', sublabel: 'We can never move money' },
];

const PAIN_POINTS = [
  { stat: '5.4M', text: 'sole traders in the UK (ONS 2025)' },
  { stat: '£0', text: 'the amount most set aside until January' },
  { stat: '2026', text: 'MTD becomes mandatory for income over £50K' },
];

const COMPETITORS = [
  { name: 'FreeAgent', price: '£19.50/mo', issue: 'Full accounting suite — more than most sole traders need' },
  { name: 'QuickBooks', price: '£12/mo', issue: 'US-focused — UK tax rules are secondary' },
  { name: 'Xero', price: '£15+/mo', issue: 'Designed for accountants to use on your behalf' },
  { name: 'Spreadsheets', price: 'Free', issue: 'Won\'t meet MTD digital record requirements' },
];

const TESTIMONIALS = [
  {
    quote: 'I used to spend an entire weekend every quarter figuring out my tax. Now I just open the app and it is all there.',
    name: 'Early access user',
    occupation: 'Freelance designer',
    stars: 5,
    saving: '',
  },
  {
    quote: 'The set-aside feature alone is worth it. I actually know what I owe before January for the first time.',
    name: 'Beta tester',
    occupation: 'IT contractor',
    stars: 4,
    saving: '',
  },
  {
    quote: 'Simple and does exactly what it says. Connected my bank in about two minutes and everything was categorised.',
    name: 'Early access user',
    occupation: 'Delivery driver',
    stars: 4,
    saving: '',
  },
];

const PLAN_FEATURES = [
  'Unlimited bank accounts',
  'AI auto-categorisation',
  'Real-time tax calculator',
  'MTD quarterly submissions',
  'Professional invoicing',
  'Expense tracking & receipts',
  'Data export (CSV)',
  'Priority support',
];

const FAQS = [
  {
    q: 'What is QuidSafe?',
    a: 'QuidSafe is a tax tracking app built specifically for UK sole traders. It connects to your bank via Open Banking, auto-categorises your transactions with AI, and tells you exactly how much to set aside for HMRC — updated in real time.',
  },
  {
    q: 'Is my bank data safe?',
    a: 'Absolutely. We use AES-256 encryption (the same standard used by banks), Open Banking is regulated by the FCA, and we only ever have read-only access to your transactions. We can never move money or make payments from your account.',
  },
  {
    q: 'What is Making Tax Digital and do I need it?',
    a: 'Making Tax Digital (MTD) for Income Tax requires sole traders to keep digital records and submit quarterly updates to HMRC. It becomes mandatory from April 2026 for income over £50,000 and April 2027 for income over £30,000. QuidSafe handles this for you automatically.',
  },
  {
    q: 'How much does QuidSafe cost?',
    a: 'QuidSafe is £7.99/month or £59.99/year (saving 37%). Every plan includes full access to all features — AI categorisation, MTD submissions, unlimited bank accounts, and more. Start with a free 14-day trial, no credit card required.',
  },
  {
    q: 'How is QuidSafe different from FreeAgent or QuickBooks?',
    a: 'Those tools are built for accountants and businesses with complex needs. QuidSafe is built specifically for sole traders — it is simpler, cheaper, and uses AI to categorise your transactions automatically instead of making you do it manually.',
  },
  {
    q: 'What banks are supported?',
    a: 'QuidSafe supports all major UK banks through TrueLayer Open Banking, including Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Nationwide, and many more.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no hidden fees. Cancel anytime from your account settings. You can also export all your data as CSV before you go — your data always belongs to you.',
  },
];

// ─── FAQ Item ────────────────────────────────────────────
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    Animated.timing(animValue, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  }, [open, animValue]);

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.faqItem,
        pressed && { opacity: 0.95 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={question}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <View style={[styles.faqChevronCircle, open && styles.faqChevronCircleOpen]}>
          <Text style={[styles.faqChevron, open && styles.faqChevronOpen]}>
            {open ? '−' : '+'}
          </Text>
        </View>
      </View>
      {open && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </Pressable>
  );
}

// ─── Phone Mockup ────────────────────────────────────────
function PhoneMockup({ scale = 1 }: { scale?: number }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 10, duration: 2000, useNativeDriver: true }),
      ])
    );
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2500, useNativeDriver: false }),
      ])
    );
    floatAnimation.start();
    glowAnimation.start();
    return () => { floatAnimation.stop(); glowAnimation.stop(); };
  }, [floatAnim, glowAnim]);

  return (
    <Animated.View style={[phoneMockupStyles.wrapper, { transform: [{ scale }, { translateY: floatAnim }] }]}>
      {/* Glow behind phone */}
      <Animated.View style={[phoneMockupStyles.phoneGlow, { opacity: glowAnim }]} />

      <View style={phoneMockupStyles.frame}>
        {/* Dynamic Island */}
        <View style={phoneMockupStyles.dynamicIsland} />

        {/* Status bar */}
        <View style={phoneMockupStyles.statusBar}>
          <Text style={phoneMockupStyles.statusTime}>9:41</Text>
          <View style={phoneMockupStyles.statusRight}>
            <Text style={phoneMockupStyles.statusIcon}>●●●</Text>
            <Text style={phoneMockupStyles.statusIcon}>▌</Text>
          </View>
        </View>

        {/* Screen content */}
        <View style={phoneMockupStyles.screen}>
          <View style={phoneMockupStyles.miniHeader}>
            <Text style={phoneMockupStyles.miniGreeting}>Good morning</Text>
            <Text style={phoneMockupStyles.miniName}>Sarah</Text>
          </View>

          {/* Gold set-aside card */}
          <LinearGradient
            colors={['rgba(202,138,4,0.25)', 'rgba(202,138,4,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={phoneMockupStyles.goldCard}
          >
            <Text style={phoneMockupStyles.goldCardLabel}>Set aside for tax</Text>
            <Text style={phoneMockupStyles.goldCardAmount}>£2,847</Text>
            <View style={phoneMockupStyles.goldCardBar}>
              <View style={phoneMockupStyles.goldCardBarFill} />
            </View>
          </LinearGradient>

          {/* Metrics */}
          <View style={phoneMockupStyles.metricsRow}>
            <View style={phoneMockupStyles.metricBox}>
              <Text style={phoneMockupStyles.metricLabel}>Income Tax</Text>
              <Text style={phoneMockupStyles.metricValue}>£1,640</Text>
            </View>
            <View style={phoneMockupStyles.metricBox}>
              <Text style={phoneMockupStyles.metricLabel}>NI</Text>
              <Text style={phoneMockupStyles.metricValue}>£407</Text>
            </View>
            <View style={phoneMockupStyles.metricBox}>
              <Text style={phoneMockupStyles.metricLabel}>Expenses</Text>
              <Text style={[phoneMockupStyles.metricValue, { color: '#16A34A' }]}>£3,210</Text>
            </View>
          </View>

          {/* Transaction cards */}
          <View style={phoneMockupStyles.txCard}>
            <View style={[phoneMockupStyles.txDot, { backgroundColor: '#16A34A' }]} />
            <View style={phoneMockupStyles.txInfo}>
              <View style={phoneMockupStyles.txLine} />
              <View style={[phoneMockupStyles.txLine, { width: '50%' }]} />
            </View>
            <Text style={phoneMockupStyles.txAmount}>+£850</Text>
          </View>
          <View style={phoneMockupStyles.txCard}>
            <View style={[phoneMockupStyles.txDot, { backgroundColor: '#CA8A04' }]} />
            <View style={phoneMockupStyles.txInfo}>
              <View style={phoneMockupStyles.txLine} />
              <View style={[phoneMockupStyles.txLine, { width: '40%' }]} />
            </View>
            <Text style={[phoneMockupStyles.txAmount, { color: 'rgba(248,250,252,0.5)' }]}>-£45</Text>
          </View>
          <View style={phoneMockupStyles.txCard}>
            <View style={[phoneMockupStyles.txDot, { backgroundColor: '#1E3A8A' }]} />
            <View style={phoneMockupStyles.txInfo}>
              <View style={phoneMockupStyles.txLine} />
              <View style={[phoneMockupStyles.txLine, { width: '60%' }]} />
            </View>
            <Text style={phoneMockupStyles.txAmount}>+£1,200</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={phoneMockupStyles.tabBar}>
          <View style={[phoneMockupStyles.tabDot, phoneMockupStyles.tabDotActive]} />
          <View style={phoneMockupStyles.tabDot} />
          <View style={phoneMockupStyles.tabDot} />
          <View style={phoneMockupStyles.tabDot} />
          <View style={phoneMockupStyles.tabDot} />
        </View>
        <View style={phoneMockupStyles.homeIndicator} />
      </View>
    </Animated.View>
  );
}

const phoneMockupStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  phoneGlow: {
    position: 'absolute',
    width: 280,
    height: 480,
    borderRadius: 140,
    backgroundColor: 'rgba(202,138,4,0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(40px)' } : {}) as any,
  },
  frame: {
    width: 220,
    height: 440,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    backgroundColor: '#0A0A12',
    overflow: 'hidden',
    position: 'relative',
  },
  dynamicIsland: {
    width: 72,
    height: 18,
    backgroundColor: '#000',
    borderRadius: 12,
    alignSelf: 'center',
    position: 'absolute',
    top: 6,
    zIndex: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 28,
    paddingBottom: 4,
  },
  statusTime: { fontFamily: Fonts.manrope.semiBold, fontSize: 7, color: 'rgba(248,250,252,0.8)' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statusIcon: { fontSize: 5, color: 'rgba(248,250,252,0.6)' },
  screen: { flex: 1, paddingHorizontal: 10, paddingTop: 2 },
  miniHeader: { paddingVertical: 6, paddingHorizontal: 2 },
  miniGreeting: { fontFamily: Fonts.manrope.regular, fontSize: 6, color: 'rgba(248,250,252,0.5)' },
  miniName: { fontFamily: Fonts.playfair.bold, fontSize: 12, color: '#F8FAFC', marginTop: 1 },
  goldCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(202,138,4,0.3)',
    padding: 10,
    marginBottom: 8,
  },
  goldCardLabel: { fontFamily: Fonts.manrope.medium, fontSize: 5.5, color: '#CA8A04', marginBottom: 2 },
  goldCardAmount: { fontFamily: Fonts.playfair.bold, fontSize: 18, color: '#FEF9C3', marginBottom: 5 },
  goldCardBar: { height: 3, backgroundColor: 'rgba(202,138,4,0.2)', borderRadius: 2 },
  goldCardBarFill: { height: 3, width: '65%', backgroundColor: '#CA8A04', borderRadius: 2 },
  metricsRow: { flexDirection: 'row', gap: 5, marginBottom: 8 },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  metricLabel: { fontFamily: Fonts.manrope.regular, fontSize: 4.5, color: 'rgba(148,163,184,0.8)', marginBottom: 2 },
  metricValue: { fontFamily: Fonts.manrope.bold, fontSize: 8, color: '#F8FAFC' },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 7,
    marginBottom: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  txDot: { width: 14, height: 14, borderRadius: 7 },
  txInfo: { flex: 1, gap: 3 },
  txLine: { height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, width: '75%' },
  txAmount: { fontFamily: Fonts.manrope.bold, fontSize: 7, color: '#16A34A' },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabDotActive: { backgroundColor: '#CA8A04' },
  homeIndicator: {
    width: 44,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 5,
  },
});

// ─── Main Landing Page ───────────────────────────────────
export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const colors = Colors.dark;
  const scrollRef = useRef<ScrollView>(null);
  const featuresYRef = useRef(0);
  const pricingYRef = useRef(0);

  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const contentMaxWidth = 1120;

  const scrollToFeatures = useCallback(() => {
    if (scrollRef.current && featuresYRef.current > 0) {
      scrollRef.current.scrollTo({ y: featuresYRef.current, animated: true });
    }
  }, []);

  const scrollToPricing = useCallback(() => {
    if (scrollRef.current && pricingYRef.current > 0) {
      scrollRef.current.scrollTo({ y: pricingYRef.current, animated: true });
    }
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════ HERO ═══════════════ */}
        <LinearGradient
          colors={['#080C18', '#0F172A', '#162044', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.hero}
        >
          {/* Background orbs */}
          <View style={styles.orbTopRight} />
          <View style={styles.orbBottomLeft} />
          <View style={styles.orbCenter} />

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            {/* Nav */}
            <View style={[styles.heroNav, { maxWidth: contentMaxWidth }]}>
              <Text style={styles.navLogo}>QuidSafe</Text>
              <View style={styles.navLinks}>
                {isDesktop && (
                  <>
                    <Pressable onPress={scrollToFeatures}>
                      <Text style={styles.navLink}>Features</Text>
                    </Pressable>
                    <Text style={styles.navLink}>Pricing</Text>
                  </>
                )}
                <Link href="/(auth)/login" asChild>
                  <Pressable style={({ pressed }) => [styles.navLoginBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="Log in">
                    <Text style={styles.navLoginText}>Log in</Text>
                  </Pressable>
                </Link>
                <Link href="/(auth)/signup" asChild>
                  <Pressable style={({ pressed }) => [styles.navCTABtn, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel="Start free trial">
                    <Text style={styles.navCTAText}>Start free</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* MTD urgency banner */}
            <View style={[styles.urgencyBanner, { maxWidth: contentMaxWidth }]}>
              <Text style={styles.urgencyDot}>●</Text>
              <Text style={styles.urgencyText}>
                Making Tax Digital is now mandatory for income over £50K.{' '}
                <Text style={styles.urgencyLink}>Are you ready?</Text>
              </Text>
            </View>

            {/* Hero content */}
            <View style={[styles.heroContent, { maxWidth: contentMaxWidth }, isDesktop && styles.heroContentDesktop]}>
              <View style={[styles.heroTextColumn, isDesktop && styles.heroTextColumnDesktop]}>
                <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
                  Stop guessing{'\n'}what you owe{'\n'}
                  <Text style={styles.heroHeadlineGold}>HMRC</Text>
                </Text>
                <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                  QuidSafe connects to your bank, auto-categorises every transaction with AI, and tells you exactly what to set aside for tax — updated in real time.
                </Text>

                <View style={[styles.heroCTAs, isDesktop && styles.heroCTAsDesktop]}>
                  <Link href="/(auth)/signup" asChild>
                    <Pressable style={({ pressed }) => [styles.ctaGold, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start free trial">
                      <Text style={styles.ctaGoldText}>Start 14-day free trial</Text>
                    </Pressable>
                  </Link>
                  <Pressable style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]} onPress={scrollToFeatures} accessibilityRole="button" accessibilityLabel="See how it works">
                    <Text style={styles.ctaGhostText}>See how it works</Text>
                  </Pressable>
                </View>

                <Text style={styles.heroNoCard}>No credit card required · Cancel anytime</Text>
              </View>

              <View style={[styles.heroPhoneColumn, isDesktop && styles.heroPhoneColumnDesktop]}>
                <PhoneMockup scale={isDesktop ? 1.05 : 0.9} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ═══════════════ TRUST BAR ═══════════════ */}
        <View style={styles.trustBar}>
          <View style={[styles.trustBarInner, { maxWidth: contentMaxWidth }, isDesktop && styles.trustBarDesktop]}>
            {TRUST_ITEMS.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <Text style={styles.trustIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.trustLabel}>{item.label}</Text>
                  <Text style={styles.trustSublabel}>{item.sublabel}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════ PAIN SECTION ═══════════════ */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>WHY IT MATTERS</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              The numbers behind sole trader tax
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Making Tax Digital changes how sole traders report to HMRC. If you earn over £50K, digital quarterly reporting is now mandatory.
            </Text>

            <View style={[styles.painGrid, isDesktop && styles.painGridDesktop]}>
              {PAIN_POINTS.map((p) => (
                <View key={p.stat} style={styles.painCard}>
                  <Text style={styles.painStat}>{p.stat}</Text>
                  <Text style={styles.painText}>{p.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <View style={[styles.section, { backgroundColor: '#0B0F1A' }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>HOW IT WORKS</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Three steps to tax peace of mind
            </Text>

            <View style={[styles.stepsRow, isDesktop && styles.stepsRowDesktop]}>
              {HOW_IT_WORKS.map((step, i) => (
                <View key={step.step} style={[styles.stepCard, { flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%' as any }]}>
                  <View style={styles.stepNumberRow}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumber}>{step.step}</Text>
                    </View>
                    {isDesktop && i < HOW_IT_WORKS.length - 1 && (
                      <View style={styles.stepConnector} />
                    )}
                  </View>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <View
          style={[styles.section, { backgroundColor: colors.background }]}
          onLayout={(e) => { featuresYRef.current = e.nativeEvent.layout.y; }}
        >
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>FEATURES</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Everything you need.{'\n'}Nothing you don{'\u2019'}t.
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Built for sole traders, not accountants. No double-entry journals, no chart of accounts — just connect your bank and go.
            </Text>

            <View style={[styles.featuresGrid, isWide && styles.featuresGridDesktop]}>
              {FEATURES.map((f) => (
                <View
                  key={f.title}
                  style={[
                    styles.featureCard,
                    { width: isWide ? '30%' as any : isDesktop ? '46%' as any : '100%' as any },
                  ]}
                >
                  <LinearGradient
                    colors={[...f.gradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.featureIconCircle, { backgroundColor: f.iconBg }]}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══════════════ STATS ═══════════════ */}
        <View style={styles.statsBar}>
          <View style={[styles.statsBarInner, { maxWidth: contentMaxWidth }, isDesktop && styles.statsBarDesktop]}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════════════ COMPARISON ═══════════════ */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.sectionInner, { maxWidth: 800 }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>WHY QUIDSAFE</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Built for sole traders.{'\n'}Not squeezed from enterprise.
            </Text>

            <View style={styles.comparisonTable}>
              <View style={styles.compHeaderRow}>
                <Text style={[styles.compHeaderCell, { flex: 2 }]}>Tool</Text>
                <Text style={styles.compHeaderCell}>Price</Text>
                <Text style={[styles.compHeaderCell, { flex: 2 }]}>Problem</Text>
              </View>
              {COMPETITORS.map((c) => (
                <View key={c.name} style={styles.compRow}>
                  <Text style={[styles.compCell, { flex: 2 }]}>{c.name}</Text>
                  <Text style={styles.compCell}>{c.price}</Text>
                  <Text style={[styles.compCellMuted, { flex: 2 }]}>{c.issue}</Text>
                </View>
              ))}
              <View style={[styles.compRow, styles.compRowHighlight]}>
                <Text style={[styles.compCellGold, { flex: 2 }]}>QuidSafe</Text>
                <Text style={styles.compCellGold}>£7.99/mo</Text>
                <Text style={[styles.compCellGold, { flex: 2 }]}>Built just for you</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <View style={[styles.section, { backgroundColor: '#0B0F1A' }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>EARLY FEEDBACK</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What our early users say
            </Text>

            <View style={[styles.testimonialsRow, isDesktop && styles.testimonialsRowDesktop]}>
              {TESTIMONIALS.map((t) => (
                <View key={t.name} style={[styles.testimonialCard, { flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%' as any }]}>
                  <View style={styles.starsRow}>
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Text key={i} style={styles.star}>★</Text>
                    ))}
                  </View>
                  <Text style={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</Text>
                  {t.saving ? (
                    <View style={styles.testimonialSaving}>
                      <Text style={styles.testimonialSavingText}>{t.saving}</Text>
                    </View>
                  ) : null}
                  <View style={styles.testimonialAuthor}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialAvatarText}>
                        {t.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.testimonialName}>{t.name}</Text>
                      <Text style={styles.testimonialOccupation}>{t.occupation}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══════════════ PRICING ═══════════════ */}
        <View style={[styles.section, { backgroundColor: colors.background }]} onLayout={(e) => { pricingYRef.current = e.nativeEvent.layout.y; }}>
          <View style={[styles.sectionInner, { maxWidth: 560 }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>PRICING</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              One plan. Full access.{'\n'}Less than a coffee a week.
            </Text>

            <View style={styles.pricingCard}>
              <LinearGradient
                colors={['rgba(202,138,4,0.1)', 'rgba(30,58,138,0.1)', 'rgba(15,23,42,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.pricingCardBorder} />

              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>14-DAY FREE TRIAL</Text>
              </View>

              {/* Monthly / Annual toggle visual */}
              <View style={styles.priceOptions}>
                <View style={styles.priceOption}>
                  <Text style={styles.priceAmount}>£7.99</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
                <View style={styles.priceOptionDivider} />
                <View style={styles.priceOption}>
                  <Text style={styles.priceAmount}>£59.99</Text>
                  <Text style={styles.pricePeriod}>/year</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 37%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pricingDivider} />

              {PLAN_FEATURES.map((feat) => (
                <View key={feat} style={styles.pricingFeatureRow}>
                  <Text style={styles.checkMark}>✓</Text>
                  <Text style={styles.pricingFeatureText}>{feat}</Text>
                </View>
              ))}

              <Link href="/(auth)/signup" asChild>
                <Pressable style={({ pressed }) => [styles.ctaGold, { marginTop: Spacing.lg }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start free trial">
                  <Text style={styles.ctaGoldText}>Start free trial</Text>
                </Pressable>
              </Link>
              <Text style={styles.pricingNoCard}>No credit card required</Text>

              <View style={styles.priceAnchor}>
                <Text style={styles.priceAnchorText}>
                  That{'\u2019'}s less than 1 hour of accountant time. Most sole traders spend £250-£600/year on an accountant.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════ MTD SECTION ═══════════════ */}
        <View style={[styles.section, { backgroundColor: '#0B0F1A' }]}>
          <View style={[styles.sectionInner, { maxWidth: 800 }]}>
            <View style={styles.mtdBadge}>
              <Text style={styles.mtdBadgeText}>IMPORTANT UPDATE</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Making Tax Digital is here.{'\n'}Are you ready?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: Spacing.xl }]}>
              From April 2026, sole traders earning over £50,000 must keep digital records and submit quarterly updates to HMRC. By 2028, this extends to everyone earning over £20,000.
            </Text>

            <View style={[styles.mtdTimeline, isDesktop && styles.mtdTimelineDesktop]}>
              <View style={styles.mtdTimelineItem}>
                <View style={[styles.mtdDot, styles.mtdDotActive]} />
                <View style={styles.mtdTimelineContent}>
                  <Text style={styles.mtdDate}>April 2026</Text>
                  <Text style={styles.mtdDesc}>Income over £50,000</Text>
                  <Text style={styles.mtdCount}>864,000 sole traders affected</Text>
                </View>
              </View>
              <View style={styles.mtdTimelineLine} />
              <View style={styles.mtdTimelineItem}>
                <View style={styles.mtdDot} />
                <View style={styles.mtdTimelineContent}>
                  <Text style={styles.mtdDate}>April 2027</Text>
                  <Text style={styles.mtdDesc}>Income over £30,000</Text>
                  <Text style={styles.mtdCount}>~2 million more affected</Text>
                </View>
              </View>
              <View style={styles.mtdTimelineLine} />
              <View style={styles.mtdTimelineItem}>
                <View style={styles.mtdDot} />
                <View style={styles.mtdTimelineContent}>
                  <Text style={styles.mtdDate}>April 2028</Text>
                  <Text style={styles.mtdDesc}>Income over £20,000</Text>
                  <Text style={styles.mtdCount}>~4.2 million total</Text>
                </View>
              </View>
            </View>

            <View style={styles.mtdCTA}>
              <Text style={styles.mtdCTAText}>QuidSafe is MTD compliant from day one.</Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable style={({ pressed }) => [styles.ctaGold, { maxWidth: 320 }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Get MTD ready">
                  <Text style={styles.ctaGoldText}>Get MTD ready now</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        {/* ═══════════════ FAQ ═══════════════ */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.sectionInner, { maxWidth: 720 }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>FAQ</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Frequently asked questions
            </Text>

            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} index={i} />
            ))}
          </View>
        </View>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <LinearGradient
          colors={['#0F172A', '#1A2B5C', '#1E3A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.finalCTA}
        >
          <View style={styles.finalCTAGlow} />
          <Text style={styles.finalCTATitle}>
            Stop guessing.{'\n'}Start knowing.
          </Text>
          <Text style={styles.finalCTASubtitle}>
            Join thousands of UK sole traders who never worry about tax again.
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable style={({ pressed }) => [styles.ctaGold, { maxWidth: 340 }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start free trial">
              <Text style={styles.ctaGoldText}>Start your free trial</Text>
            </Pressable>
          </Link>
          <Text style={styles.finalNoCard}>14 days free · No credit card · Cancel anytime</Text>
        </LinearGradient>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <View style={styles.footer}>
          <View style={[styles.footerInner, { maxWidth: contentMaxWidth }, isDesktop && styles.footerDesktop]}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>QuidSafe</Text>
              <Text style={styles.footerTagline}>Your tax. Sorted. Safe.</Text>
            </View>

            <View style={[styles.footerColsRow, isDesktop && styles.footerColsRowDesktop]}>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Product</Text>
                <Pressable onPress={scrollToFeatures}><Text style={styles.footerLink}>Features</Text></Pressable>
                <Pressable onPress={scrollToPricing}><Text style={styles.footerLink}>Pricing</Text></Pressable>
                <Link href="/mtd" asChild><Pressable><Text style={styles.footerLink}>MTD Guide</Text></Pressable></Link>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Company</Text>
                <Link href="/about" asChild><Pressable><Text style={styles.footerLink}>About</Text></Pressable></Link>
                <Link href="/about" asChild><Pressable><Text style={styles.footerLink}>Contact</Text></Pressable></Link>
                <Link href="/learn" asChild><Pressable><Text style={styles.footerLink}>Blog</Text></Pressable></Link>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Legal</Text>
                <Link href="/privacy" asChild><Pressable><Text style={styles.footerLink}>Privacy Policy</Text></Pressable></Link>
                <Link href="/terms" asChild><Pressable><Text style={styles.footerLink}>Terms of Service</Text></Pressable></Link>
                <Link href="/cookie-policy" asChild><Pressable><Text style={styles.footerLink}>Cookie Policy</Text></Pressable></Link>
              </View>
            </View>
          </View>

          <View style={[styles.footerBottom, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.footerCopyright}>© 2026 QuidSafe Ltd · Made in the UK</Text>
            <Text style={styles.footerDisclaimer}>
              QuidSafe is not a regulated financial adviser. Tax calculations are estimates and should not be considered financial advice. Open Banking provided by TrueLayer Ltd, authorised by the FCA.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C18' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Hero ──
  hero: { paddingBottom: 40, overflow: 'hidden', position: 'relative' },
  orbTopRight: {
    position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(30,58,138,0.15)',
  },
  orbBottomLeft: {
    position: 'absolute', bottom: -50, left: -150, width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(202,138,4,0.06)',
  },
  orbCenter: {
    position: 'absolute', top: '40%', left: '30%', width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(30,58,138,0.08)',
    transform: [{ translateX: -250 }, { translateY: -250 }],
  },
  heroSafe: { alignItems: 'center', width: '100%' },

  // Nav
  heroNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  navLogo: { fontFamily: Fonts.playfair.bold, fontSize: 28, color: Colors.white, letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  navLink: { fontFamily: Fonts.manrope.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  navLoginBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.button,
  },
  navLoginText: { fontFamily: Fonts.manrope.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  navCTABtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: BorderRadius.button, backgroundColor: Colors.accent,
  },
  navCTAText: { fontFamily: Fonts.manrope.bold, fontSize: 14, color: Colors.white },

  // Urgency banner
  urgencyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
    borderRadius: BorderRadius.pill, paddingVertical: 8, paddingHorizontal: 16,
    marginTop: Spacing.md, marginHorizontal: Spacing.lg,
    alignSelf: 'center',
  },
  urgencyDot: { fontSize: 8, color: '#DC2626' },
  urgencyText: { fontFamily: Fonts.manrope.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  urgencyLink: { color: '#DC2626', textDecorationLine: 'underline' },

  // Hero content
  heroContent: {
    alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: 48, width: '100%',
  },
  heroContentDesktop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60,
  },
  heroTextColumn: { alignItems: 'center', width: '100%' },
  heroTextColumnDesktop: { flex: 1, alignItems: 'flex-start', paddingRight: Spacing.xxl },
  heroPhoneColumn: { alignItems: 'center', marginTop: 48 },
  heroPhoneColumnDesktop: { marginTop: 0, flexShrink: 0 },
  heroHeadline: {
    fontFamily: Fonts.playfair.bold, fontSize: 42, color: Colors.white,
    textAlign: 'center', lineHeight: 52, letterSpacing: -0.5,
  },
  heroHeadlineDesktop: { fontSize: 64, lineHeight: 76, textAlign: 'left', letterSpacing: -1 },
  heroHeadlineGold: { color: Colors.accent },
  heroSubtitle: {
    fontFamily: Fonts.manrope.regular, fontSize: 18, color: 'rgba(248,250,252,0.6)',
    textAlign: 'center', marginTop: Spacing.lg, lineHeight: 30, maxWidth: 520,
  },
  heroSubtitleDesktop: { fontSize: 20, lineHeight: 32, textAlign: 'left' },
  heroCTAs: {
    flexDirection: 'column', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.xl, width: '100%', maxWidth: 380,
  },
  heroCTAsDesktop: { flexDirection: 'row', alignItems: 'center', maxWidth: 440 },
  heroNoCard: {
    fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.md,
  },

  // CTAs
  ctaGold: {
    backgroundColor: Colors.accent, paddingVertical: 18, paddingHorizontal: 36,
    borderRadius: BorderRadius.button, alignItems: 'center', width: '100%',
    ...Shadows.large,
  },
  ctaGoldText: { fontFamily: Fonts.manrope.bold, fontSize: 16, color: Colors.white, letterSpacing: 0.3 },
  ctaGhost: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: BorderRadius.button,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', width: '100%',
  },
  ctaGhostText: { fontFamily: Fonts.manrope.semiBold, fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },

  // ── Trust Bar ──
  trustBar: {
    backgroundColor: '#060A14', paddingVertical: Spacing.xl, alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  trustBarInner: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
    gap: Spacing.xl, paddingHorizontal: Spacing.lg, width: '100%',
  },
  trustBarDesktop: { gap: 56 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trustIcon: { fontFamily: Fonts.manrope.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.5 },
  trustLabel: { fontFamily: Fonts.manrope.semiBold, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  trustSublabel: { fontFamily: Fonts.manrope.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  // ── Section ──
  section: { paddingVertical: 80, alignItems: 'center' },
  sectionInner: { width: '100%', paddingHorizontal: Spacing.lg, alignItems: 'center' },
  sectionTag: {
    fontFamily: Fonts.manrope.bold, fontSize: 11, letterSpacing: 3, marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: Fonts.playfair.bold, fontSize: 32, textAlign: 'center',
    marginBottom: Spacing.lg, lineHeight: 42, letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: Fonts.manrope.regular, fontSize: 17, textAlign: 'center',
    lineHeight: 28, maxWidth: 600, marginBottom: Spacing.xl,
  },

  // ── Pain section ──
  painGrid: { flexDirection: 'column', gap: Spacing.md, width: '100%' },
  painGridDesktop: { flexDirection: 'row' },
  painCard: {
    flex: 1, backgroundColor: 'rgba(220,38,38,0.06)', borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)', borderRadius: BorderRadius.card,
    padding: Spacing.lg, alignItems: 'center',
  },
  painStat: {
    fontFamily: Fonts.playfair.bold, fontSize: 44, color: '#DC2626', marginBottom: Spacing.xs,
    letterSpacing: -1,
  },
  painText: {
    fontFamily: Fonts.manrope.regular, fontSize: 14, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 22,
  },

  // ── How it works ──
  stepsRow: { flexDirection: 'column', gap: Spacing.xl, width: '100%' },
  stepsRowDesktop: { flexDirection: 'row', gap: Spacing.lg },
  stepCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.hero,
    padding: Spacing.xl, alignItems: 'center',
  },
  stepNumberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, width: '100%', justifyContent: 'center' },
  stepNumberCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(202,138,4,0.15)',
    borderWidth: 1, borderColor: 'rgba(202,138,4,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumber: { fontFamily: Fonts.manrope.bold, fontSize: 14, color: Colors.accent },
  stepConnector: {
    flex: 1, height: 1, backgroundColor: 'rgba(202,138,4,0.15)', marginLeft: Spacing.md,
  },
  stepIcon: { fontSize: 32, marginBottom: Spacing.md },
  stepTitle: {
    fontFamily: Fonts.manrope.bold, fontSize: 19, color: Colors.white,
    marginBottom: Spacing.sm, textAlign: 'center', letterSpacing: -0.2,
  },
  stepDesc: {
    fontFamily: Fonts.manrope.regular, fontSize: 14, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 22,
  },

  // ── Features ──
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, width: '100%',
  },
  featuresGridDesktop: { gap: Spacing.lg },
  featureCard: {
    borderRadius: BorderRadius.hero, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: Spacing.xl,
    overflow: 'hidden', position: 'relative',
  },
  featureIconCircle: {
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: { fontSize: 22, color: Colors.white },
  featureTitle: {
    fontFamily: Fonts.manrope.bold, fontSize: 18, color: Colors.white, marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontFamily: Fonts.manrope.regular, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.55)',
  },

  // ── Stats bar ──
  statsBar: {
    backgroundColor: Colors.accent, paddingVertical: Spacing.xxl, alignItems: 'center',
  },
  statsBarInner: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
    gap: Spacing.xl, paddingHorizontal: Spacing.lg, width: '100%',
  },
  statsBarDesktop: { justifyContent: 'space-around' },
  statItem: { alignItems: 'center', minWidth: 120 },
  statValue: { fontFamily: Fonts.playfair.bold, fontSize: 32, color: Colors.white, letterSpacing: -0.5 },
  statLabel: { fontFamily: Fonts.manrope.medium, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // ── Comparison ──
  comparisonTable: {
    width: '100%', borderRadius: BorderRadius.card, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  compHeaderRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 12, paddingHorizontal: 16,
  },
  compHeaderCell: {
    flex: 1, fontFamily: Fonts.manrope.bold, fontSize: 12, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  compRow: {
    flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  compRowHighlight: {
    backgroundColor: 'rgba(202,138,4,0.08)', borderTopColor: 'rgba(202,138,4,0.2)',
  },
  compCell: { flex: 1, fontFamily: Fonts.manrope.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  compCellMuted: { flex: 1, fontFamily: Fonts.manrope.regular, fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  compCellGold: { flex: 1, fontFamily: Fonts.manrope.bold, fontSize: 14, color: Colors.accent },

  // ── Testimonials ──
  testimonialsRow: { flexDirection: 'column', gap: Spacing.md, width: '100%' },
  testimonialsRowDesktop: { flexDirection: 'row' },
  testimonialCard: {
    borderRadius: BorderRadius.hero, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)', padding: Spacing.xl,
  },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: Spacing.md },
  star: { fontSize: 16, color: Colors.accent },
  testimonialQuote: {
    fontFamily: Fonts.manrope.regular, fontSize: 15, lineHeight: 24,
    color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: Spacing.md,
  },
  testimonialSaving: {
    backgroundColor: 'rgba(22,163,74,0.1)', borderRadius: BorderRadius.pill,
    paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: Spacing.md,
  },
  testimonialSavingText: { fontFamily: Fonts.manrope.semiBold, fontSize: 12, color: '#16A34A' },
  testimonialAuthor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  testimonialAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(202,138,4,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  testimonialAvatarText: { fontFamily: Fonts.manrope.bold, fontSize: 14, color: Colors.accent },
  testimonialName: { fontFamily: Fonts.manrope.semiBold, fontSize: 14, color: Colors.white },
  testimonialOccupation: { fontFamily: Fonts.manrope.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)' },

  // ── Pricing ──
  pricingCard: {
    width: '100%', borderRadius: BorderRadius.hero, overflow: 'hidden',
    padding: Spacing.xl, position: 'relative',
  },
  pricingCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1, borderColor: 'rgba(202,138,4,0.2)', borderRadius: BorderRadius.hero,
  },
  proBadge: {
    backgroundColor: Colors.accent, paddingVertical: 5, paddingHorizontal: 14,
    borderRadius: BorderRadius.pill, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  proBadgeText: { fontFamily: Fonts.manrope.bold, fontSize: 11, color: Colors.white, letterSpacing: 1.5 },
  priceOptions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.lg, marginBottom: Spacing.lg,
  },
  priceOption: { alignItems: 'center' },
  priceAmount: { fontFamily: Fonts.playfair.bold, fontSize: 42, color: Colors.white, letterSpacing: -1 },
  pricePeriod: { fontFamily: Fonts.manrope.regular, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  priceOptionDivider: {
    width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  saveBadge: {
    backgroundColor: 'rgba(22,163,74,0.15)', borderRadius: BorderRadius.pill,
    paddingVertical: 3, paddingHorizontal: 8, marginTop: 4,
  },
  saveBadgeText: { fontFamily: Fonts.manrope.bold, fontSize: 10, color: '#16A34A', letterSpacing: 0.5 },
  pricingDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: Spacing.lg },
  pricingFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 10 },
  checkMark: { fontFamily: Fonts.manrope.bold, fontSize: 16, color: Colors.accent },
  pricingFeatureText: { fontFamily: Fonts.manrope.regular, fontSize: 15, color: 'rgba(255,255,255,0.75)' },
  pricingNoCard: {
    fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', marginTop: Spacing.sm,
  },
  priceAnchor: {
    marginTop: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.card,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  priceAnchorText: {
    fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 20,
  },

  // ── MTD ──
  mtdBadge: {
    backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
    borderRadius: BorderRadius.pill, paddingVertical: 6, paddingHorizontal: 16, marginBottom: Spacing.md,
  },
  mtdBadgeText: { fontFamily: Fonts.manrope.bold, fontSize: 11, color: '#DC2626', letterSpacing: 1.5 },
  mtdTimeline: { width: '100%', gap: 0 },
  mtdTimelineDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  mtdTimelineItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md,
  },
  mtdDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginTop: 4,
  },
  mtdDotActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  mtdTimelineLine: {
    width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 6,
  },
  mtdTimelineContent: { flex: 1 },
  mtdDate: { fontFamily: Fonts.manrope.bold, fontSize: 16, color: Colors.white, marginBottom: 2 },
  mtdDesc: { fontFamily: Fonts.manrope.medium, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  mtdCount: { fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  mtdCTA: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.md },
  mtdCTAText: {
    fontFamily: Fonts.manrope.semiBold, fontSize: 16, color: Colors.accent, textAlign: 'center',
  },

  // ── FAQ ──
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: Spacing.lg, marginBottom: Spacing.sm, width: '100%',
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: {
    fontFamily: Fonts.manrope.semiBold, fontSize: 15, color: Colors.white,
    flex: 1, paddingRight: Spacing.md,
  },
  faqChevronCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  faqChevronCircleOpen: { backgroundColor: 'rgba(202,138,4,0.15)' },
  faqChevron: { fontFamily: Fonts.manrope.bold, fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  faqChevronOpen: { color: Colors.accent },
  faqAnswer: {
    fontFamily: Fonts.manrope.regular, fontSize: 14, lineHeight: 22,
    color: 'rgba(255,255,255,0.55)', marginTop: Spacing.md,
  },

  // ── Final CTA ──
  finalCTA: {
    paddingVertical: 80, alignItems: 'center', paddingHorizontal: Spacing.lg,
    position: 'relative', overflow: 'hidden',
  },
  finalCTAGlow: {
    position: 'absolute', top: '50%', left: '50%', width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(202,138,4,0.08)',
    transform: [{ translateX: -250 }, { translateY: -250 }],
  },
  finalCTATitle: {
    fontFamily: Fonts.playfair.bold, fontSize: 38, color: Colors.white,
    textAlign: 'center', marginBottom: Spacing.md, lineHeight: 50, letterSpacing: -0.5,
  },
  finalCTASubtitle: {
    fontFamily: Fonts.manrope.regular, fontSize: 17, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', marginBottom: Spacing.xl, maxWidth: 480,
  },
  finalNoCard: {
    fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.35)',
    marginTop: Spacing.md,
  },

  // ── Footer ──
  footer: {
    backgroundColor: '#050810', paddingTop: Spacing.xxl, paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  footerInner: {
    width: '100%', gap: Spacing.xl,
  },
  footerDesktop: { flexDirection: 'row', justifyContent: 'space-between' },
  footerBrand: {},
  footerLogo: { fontFamily: Fonts.playfair.bold, fontSize: 24, color: Colors.white, letterSpacing: -0.3 },
  footerTagline: {
    fontFamily: Fonts.manrope.regular, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4,
  },
  footerColsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl },
  footerColsRowDesktop: { gap: 56 },
  footerCol: { gap: Spacing.sm, minWidth: 100 },
  footerColTitle: {
    fontFamily: Fonts.manrope.bold, fontSize: 12, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.xs,
  },
  footerLink: { fontFamily: Fonts.manrope.regular, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  footerBottom: {
    width: '100%', alignItems: 'center', gap: 6,
    marginTop: Spacing.xl, paddingTop: Spacing.lg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  footerCopyright: { fontFamily: Fonts.manrope.regular, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  footerDisclaimer: {
    fontFamily: Fonts.manrope.regular, fontSize: 11, color: 'rgba(255,255,255,0.2)',
    textAlign: 'center', maxWidth: 500,
  },
});

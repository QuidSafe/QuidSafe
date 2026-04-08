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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';


// ─── Section IDs for nav ───────────────────────────────
const NAV_SECTIONS = ['Features', 'How it works', 'Pricing', 'FAQ'] as const;
type SectionId = (typeof NAV_SECTIONS)[number];


// ─── Data ────────────────────────────────────────────────
const STATS = [
  { value: '5.4M', label: 'UK sole traders (ONS)' },
  { value: 'Apr 2026', label: 'MTD deadline for £50K+ income' },
  { value: '£7.99', label: 'per month inc. VAT' },
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

const FEATURES: {
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
  gradient: readonly [string, string];
  iconBg: string;
  iconColor: string;
}[] = [
  {
    iconName: 'magic',
    title: 'AI Categorisation',
    description: 'Every transaction auto-categorised by AI. No more "is this an allowable expense?" guessing.',
    gradient: ['rgba(202,138,4,0.15)', 'rgba(202,138,4,0.05)'],
    iconBg: 'rgba(202,138,4,0.2)',
    iconColor: '#CA8A04',
  },
  {
    iconName: 'calculator',
    title: 'Tax Set-Aside Calculator',
    description: 'Know your Income Tax and National Insurance in real time — not as a surprise in January.',
    gradient: ['rgba(22,163,74,0.15)', 'rgba(22,163,74,0.05)'],
    iconBg: 'rgba(22,163,74,0.2)',
    iconColor: '#16A34A',
  },
  {
    iconName: 'calendar-check-o',
    title: 'MTD Quarterly Submissions',
    description: 'Submit to HMRC directly from the app. Making Tax Digital compliant from day one.',
    gradient: ['rgba(30,58,138,0.2)', 'rgba(30,58,138,0.05)'],
    iconBg: 'rgba(30,58,138,0.3)',
    iconColor: '#3B82F6',
  },
  {
    iconName: 'university',
    title: 'Open Banking Integration',
    description: 'Connect your existing bank accounts. No new accounts needed. Via TrueLayer (FCA authorised).',
    gradient: ['rgba(148,163,184,0.1)', 'rgba(148,163,184,0.03)'],
    iconBg: 'rgba(148,163,184,0.15)',
    iconColor: '#94A3B8',
  },
  {
    iconName: 'file-text-o',
    title: 'Professional Invoices',
    description: 'Create, send, and track invoices. Know when you have been paid — all in one place.',
    gradient: ['rgba(202,138,4,0.1)', 'rgba(30,58,138,0.05)'],
    iconBg: 'rgba(202,138,4,0.15)',
    iconColor: '#CA8A04',
  },
  {
    iconName: 'download',
    title: 'Full Data Export',
    description: 'Download everything as CSV anytime. Your data always belongs to you.',
    gradient: ['rgba(148,163,184,0.1)', 'rgba(148,163,184,0.02)'],
    iconBg: 'rgba(148,163,184,0.12)',
    iconColor: '#94A3B8',
  },
];

const TRUST_ITEMS: { iconName: React.ComponentProps<typeof FontAwesome>['name']; label: string; sublabel: string }[] = [
  { iconName: 'shield', label: 'FCA-Regulated Banking', sublabel: 'Open Banking via TrueLayer' },
  { iconName: 'lock', label: 'AES-256 Encryption', sublabel: 'Bank-grade security' },
  { iconName: 'check-circle', label: 'HMRC Compliant', sublabel: 'Making Tax Digital ready' },
  { iconName: 'eye', label: 'Read-Only Access', sublabel: 'We can never move money' },
  { iconName: 'building-o', label: 'HMRC Recognised', sublabel: 'Approved for MTD submissions' },
];

const SUPPORTED_BANKS = [
  'Barclays', 'HSBC', 'Lloyds', 'NatWest', 'Monzo', 'Starling', 'Revolut', 'Nationwide',
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
    a: 'QuidSafe is £7.99/month or £79.99/year (save 17%) — all prices include VAT. Every plan includes full access to all features — AI categorisation, MTD submissions, unlimited bank accounts, and more. VAT-registered sole traders can reclaim VAT on the subscription. Start with a free 14-day trial, no credit card required.',
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
function FAQItem({ question, answer }: { question: string; answer: string }) {
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

// ─── Main Landing Page ───────────────────────────────────
export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const colors = Colors.dark;
  const scrollRef = useRef<ScrollView>(null);

  // Section y-offsets for scroll-to navigation
  const sectionOffsets = useRef<Record<SectionId, number>>({
    'Features': 0,
    'How it works': 0,
    'Pricing': 0,
    'FAQ': 0,
  });

  // Track which section is active for nav highlighting
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [headerSolid, setHeaderSolid] = useState(false);

  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const contentMaxWidth = 1120;

  const scrollToSection = useCallback((section: SectionId) => {
    const y = sectionOffsets.current[section];
    if (scrollRef.current && y > 0) {
      // Offset by sticky header height
      scrollRef.current.scrollTo({ y: y - 56, animated: true });
    }
  }, []);

  const prevHeaderSolid = useRef(false);
  const prevActiveSection = useRef<SectionId | null>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;

      // Only setState when value actually changes — prevents no-op re-renders at 60fps
      const solid = y > 80;
      if (solid !== prevHeaderSolid.current) {
        prevHeaderSolid.current = solid;
        setHeaderSolid(solid);
      }

      const offset = y + 120;
      const sections = NAV_SECTIONS;
      let current: SectionId | null = null;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sectionOffsets.current[sections[i]] > 0 && offset >= sectionOffsets.current[sections[i]]) {
          current = sections[i];
          break;
        }
      }
      if (current !== prevActiveSection.current) {
        prevActiveSection.current = current;
        setActiveSection(current);
      }
    },
    [],
  );

  return (
    <View style={styles.root}>
      {/* ═══════════════ STICKY HEADER ═══════════════ */}
      <View
        style={[
          styles.stickyHeader,
          headerSolid && styles.stickyHeaderSolid,
        ]}
      >
        <View style={[styles.stickyHeaderInner, { maxWidth: contentMaxWidth }]}>
          <Pressable
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
          >
            <BrandLogo size={28} textSize={20} />
          </Pressable>

          <View style={styles.stickyNav}>
            {isDesktop &&
              NAV_SECTIONS.map((section) => (
                <Pressable
                  key={section}
                  onPress={() => scrollToSection(section)}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${section}`}
                >
                  <Text
                    style={[
                      styles.stickyNavLink,
                      activeSection === section && styles.stickyNavLinkActive,
                    ]}
                  >
                    {section}
                  </Text>
                  {activeSection === section && <View style={styles.stickyNavIndicator} />}
                </Pressable>
              ))}

            <Link href="/(auth)/login" asChild>
              <Pressable
                style={({ pressed }) => [styles.navLoginBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <Text style={styles.navLoginText}>Log in</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <Pressable
                style={({ pressed }) => [styles.navCTABtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Start free trial"
              >
                <Text style={styles.navCTAText}>Start free</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ═══════════════ HERO ═══════════════ */}
        <LinearGradient
          colors={['#080C18', '#0F172A', '#162044', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.hero}
        >

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            {/* Hero-local nav (hidden once sticky header takes over) */}
            <View style={[styles.heroNav, { maxWidth: contentMaxWidth }]}>
              <BrandLogo size={36} textSize={28} />
              <View style={styles.navLinks}>
                {isDesktop &&
                  NAV_SECTIONS.map((section) => (
                    <Pressable key={section} onPress={() => scrollToSection(section)}>
                      <Text style={styles.navLink}>{section}</Text>
                    </Pressable>
                  ))}
                <Link href="/(auth)/login" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.navLoginBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Log in"
                  >
                    <Text style={styles.navLoginText}>Log in</Text>
                  </Pressable>
                </Link>
                <Link href="/(auth)/signup" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.navCTABtn, pressed && { opacity: 0.85 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Start free trial"
                  >
                    <Text style={styles.navCTAText}>Start free</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* MTD urgency banner */}
            <View style={[styles.urgencyBanner, { maxWidth: contentMaxWidth }]}>
              <Text style={styles.urgencyDot}>●</Text>
              <Text style={styles.urgencyText}>
                Making Tax Digital is mandatory for income over £50K. QuidSafe is MTD compliant from day one.
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
                  <Pressable style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]} onPress={() => scrollToSection('How it works')} accessibilityRole="button" accessibilityLabel="See how it works">
                    <Text style={styles.ctaGhostText}>See how it works</Text>
                  </Pressable>
                </View>

                <Text style={styles.heroNoCard}>No credit card required · Cancel anytime</Text>
                <Text style={styles.heroJoinCount}>Built for UK sole traders. Try free for 14 days.</Text>
              </View>

            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ═══════════════ TRUST BAR ═══════════════ */}
        <View style={styles.trustBar}>
          <View style={[styles.trustBarInner, { maxWidth: contentMaxWidth }, isDesktop && styles.trustBarDesktop]}>
            {TRUST_ITEMS.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <View style={styles.trustIconCircle}>
                  <FontAwesome name={item.iconName} size={14} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.trustLabel}>{item.label}</Text>
                  <Text style={styles.trustSublabel}>{item.sublabel}</Text>
                </View>
              </View>
            ))}
          </View>
          {/* Bank logo strip */}
          <View style={[styles.bankStrip, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.bankStripPrefix}>Works with:</Text>
            <Text style={styles.bankStripNames}>
              {SUPPORTED_BANKS.join('  ·  ')}
            </Text>
          </View>
        </View>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <View
          style={[styles.section, { backgroundColor: '#0B0F1A' }]}
          onLayout={(e) => { sectionOffsets.current['How it works'] = e.nativeEvent.layout.y; }}
        >
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
          onLayout={(e) => { sectionOffsets.current['Features'] = e.nativeEvent.layout.y; }}
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
                    <FontAwesome name={f.iconName} size={22} color={f.iconColor} />
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

        {/* ═══════════════ PRICING ═══════════════ */}
        <View style={[styles.section, { backgroundColor: colors.background }]} onLayout={(e) => { sectionOffsets.current['Pricing'] = e.nativeEvent.layout.y; }}>
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
                  <Text style={styles.priceAmount}>£79.99</Text>
                  <Text style={styles.pricePeriod}>/year</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 17%</Text>
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
              <Text style={styles.pricingNoCard}>No credit card required · All prices inc. VAT</Text>

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
        <View
          style={[styles.section, { backgroundColor: colors.background }]}
          onLayout={(e) => { sectionOffsets.current['FAQ'] = e.nativeEvent.layout.y; }}
        >
          <View style={[styles.sectionInner, { maxWidth: 720 }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>FAQ</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Frequently asked questions
            </Text>

            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
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
            The simplest way for UK sole traders to stay on top of tax.
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
              <BrandLogo size={32} textSize={24} />
              <Text style={styles.footerTagline}>Your tax. Sorted. Safe.</Text>
            </View>

            <View style={[styles.footerColsRow, isDesktop && styles.footerColsRowDesktop]}>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Product</Text>
                <Pressable onPress={() => scrollToSection('Features')}><Text style={styles.footerLink}>Features</Text></Pressable>
                <Pressable onPress={() => scrollToSection('Pricing')}><Text style={styles.footerLink}>Pricing</Text></Pressable>
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

  // ── Sticky Header ──
  stickyHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(8,12,24,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as any,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      transition: 'background-color 0.3s ease',
    } : {}) as any,
  },
  stickyHeaderSolid: {
    backgroundColor: 'rgba(8,12,24,0.95)',
  },
  stickyHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  stickyNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stickyNavLink: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stickyNavLinkActive: {
    color: Colors.accent,
  },
  stickyNavIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },

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
    backgroundColor: 'rgba(30,58,138,0.1)', borderWidth: 1, borderColor: 'rgba(30,58,138,0.2)',
    borderRadius: BorderRadius.pill, paddingVertical: 8, paddingHorizontal: 16,
    marginTop: Spacing.md, marginHorizontal: Spacing.lg,
    alignSelf: 'center',
  },
  urgencyDot: { fontSize: 8, color: Colors.secondary },
  urgencyText: { fontFamily: Fonts.manrope.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },

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
  heroJoinCount: {
    fontFamily: Fonts.manrope.semiBold, fontSize: 13, color: Colors.accent,
    marginTop: Spacing.sm, opacity: 0.85,
  },

  // CTAs
  ctaGold: {
    backgroundColor: Colors.accent, paddingVertical: 18, paddingHorizontal: 36,
    borderRadius: 14, alignItems: 'center', width: '100%',
    shadowColor: 'rgba(202,138,4,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaGoldText: { fontFamily: Fonts.manrope.bold, fontSize: 16, color: Colors.white, letterSpacing: 0.3 },
  ctaGhost: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
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
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(202,138,4,0.1)',
    borderWidth: 1, borderColor: 'rgba(202,138,4,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  trustLabel: { fontFamily: Fonts.manrope.semiBold, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  trustSublabel: { fontFamily: Fonts.manrope.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  bankStrip: {
    width: '100%', alignItems: 'center', paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg, paddingTop: Spacing.lg,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  bankStripPrefix: {
    fontFamily: Fonts.manrope.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  bankStripNames: {
    fontFamily: Fonts.manrope.medium, fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 22,
  },

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
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: Spacing.xl,
    overflow: 'hidden', position: 'relative',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIconCircle: {
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  // featureIcon removed — using FontAwesome component instead
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

  // ── Pricing ──
  pricingCard: {
    width: '100%', borderRadius: 24, overflow: 'hidden',
    padding: Spacing.xl, position: 'relative',
    shadowColor: 'rgba(202,138,4,0.15)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  pricingCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5, borderColor: 'rgba(202,138,4,0.25)', borderRadius: 24,
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

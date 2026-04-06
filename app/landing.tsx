import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';

// ─── Feature data ────────────────────────────────────────
const FEATURES = [
  {
    icon: '✦',
    title: 'Smart Categorisation',
    description: 'AI auto-categorises your transactions so you never miss a deductible expense.',
  },
  {
    icon: '◎',
    title: 'Tax Calculator',
    description: 'Know your Income Tax and National Insurance in real-time, not at year end.',
  },
  {
    icon: '▣',
    title: 'Making Tax Digital',
    description: 'Submit quarterly updates to HMRC directly from the app.',
  },
  {
    icon: '⟐',
    title: 'Bank Connection',
    description: 'Connect via Open Banking in seconds. Read-only, fully secure.',
  },
  {
    icon: '☰',
    title: 'Invoice Tracking',
    description: 'Create professional invoices, send them, and track when they are paid.',
  },
  {
    icon: '⤓',
    title: 'Data Export',
    description: 'Download your data as CSV anytime. Your data, your control.',
  },
];

const TRUST_ITEMS = [
  { icon: '🏦', label: 'FCA Regulated Banking' },
  { icon: '🔒', label: '256-bit Encryption' },
  { icon: '✓', label: 'HMRC Compliant' },
  { icon: '👁', label: 'Read-Only Access' },
];

const TESTIMONIALS = [
  {
    quote: 'QuidSafe saved me hours every month. I used to dread tax season — now it is just a button press.',
    name: 'Sarah Mitchell',
    occupation: 'Freelance Designer',
  },
  {
    quote: 'The bank connection is brilliant. Everything is categorised before I even open the app.',
    name: 'James Okonkwo',
    occupation: 'IT Consultant',
  },
  {
    quote: 'Finally, an app that understands UK sole traders. The tax set-aside feature gives me real peace of mind.',
    name: 'Emma Griffiths',
    occupation: 'Photography Business Owner',
  },
];

const FAQS = [
  {
    q: 'What is QuidSafe?',
    a: 'QuidSafe is a tax tracking app built specifically for UK sole traders. It connects to your bank, auto-categorises your transactions, and tells you exactly how much to set aside for HMRC.',
  },
  {
    q: 'Is Open Banking safe?',
    a: 'Absolutely. Open Banking is regulated by the FCA. QuidSafe only has read-only access to your transactions — we can never move money or make payments from your account.',
  },
  {
    q: 'Is QuidSafe HMRC compliant?',
    a: 'Yes. QuidSafe is designed with Making Tax Digital (MTD) in mind and supports quarterly submissions directly to HMRC.',
  },
  {
    q: 'How much does it cost?',
    a: 'QuidSafe offers a free tier with basic features. Pro is just £9.99/month or £89.99/year — saving you two months with the annual plan.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. You can download all your transaction and tax data as CSV at any time. Your data always belongs to you.',
  },
  {
    q: 'What banks are supported?',
    a: 'QuidSafe supports all major UK banks through TrueLayer Open Banking, including Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, and many more.',
  },
];

const FREE_FEATURES = [
  '1 bank account',
  'Basic tax calculator',
  'Manual expense entry',
  'Dashboard overview',
];

const PRO_FEATURES = [
  'Unlimited bank accounts',
  'AI auto-categorisation',
  'MTD quarterly submissions',
  'Invoice tracking',
  'Data export (CSV)',
  'Priority support',
];

// ─── FAQ Item ────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={({ pressed }) => [
        styles.faqItem,
        pressed && { opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={question}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Text style={styles.faqChevron}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={styles.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

// ─── Main Landing Page ───────────────────────────────────
export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const featuresYRef = useRef(0);

  const isDesktop = width >= 768;
  const isWideDesktop = width >= 1024;
  const contentMaxWidth = 1100;

  const scrollToFeatures = useCallback(() => {
    if (scrollRef.current && featuresYRef.current > 0) {
      scrollRef.current.scrollTo({ y: featuresYRef.current, animated: true });
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
        {/* ═══ HERO ═══ */}
        <LinearGradient
          colors={['#0F172A', '#1E3A8A', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Gold glow effect */}
          <View style={styles.goldGlow} />

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            {/* Nav bar */}
            <View style={[styles.heroNav, { maxWidth: contentMaxWidth }]}>
              <Text style={styles.navLogo}>QuidSafe</Text>
              <View style={styles.navLinks}>
                <Link href="/(auth)/login" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.navLoginBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Log in"
                  >
                    <Text style={styles.navLoginText}>Log in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Hero content */}
            <View style={[styles.heroContent, { maxWidth: contentMaxWidth }]}>
              <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
                Tax tracking for{'\n'}UK sole traders
              </Text>
              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                Connect your bank. Auto-categorise expenses.{'\n'}Know exactly what to set aside for HMRC.
              </Text>

              <View style={[styles.heroCTAs, isDesktop && styles.heroCTAsDesktop]}>
                <Link href="/(auth)/signup" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.ctaGold, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Start Free Trial"
                  >
                    <Text style={styles.ctaGoldText}>Start Free Trial</Text>
                  </Pressable>
                </Link>
                <Pressable
                  style={({ pressed }) => [styles.ctaOutline, pressed && styles.pressed]}
                  onPress={scrollToFeatures}
                  accessibilityRole="button"
                  accessibilityLabel="Learn More"
                >
                  <Text style={styles.ctaOutlineText}>Learn More</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ═══ TRUST BAR ═══ */}
        <View style={styles.trustBar}>
          <View
            style={[
              styles.trustBarInner,
              { maxWidth: contentMaxWidth },
              isDesktop && styles.trustBarDesktop,
            ]}
          >
            {TRUST_ITEMS.map((item) => (
              <View key={item.label} style={styles.trustItem}>
                <Text style={styles.trustIcon}>{item.icon}</Text>
                <Text style={styles.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ FEATURES ═══ */}
        <View
          style={[styles.section, { backgroundColor: colors.background }]}
          onLayout={(e) => {
            featuresYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>FEATURES</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Everything you need to stay on top of your taxes
            </Text>

            <View style={[styles.featuresGrid, isWideDesktop && styles.featuresGridDesktop]}>
              {FEATURES.map((f) => (
                <View
                  key={f.title}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      width: isWideDesktop ? '30%' as unknown as number : isDesktop ? '45%' as unknown as number : '100%' as unknown as number,
                    },
                  ]}
                >
                  <View style={styles.featureIconCircle}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                  </View>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    {f.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══ PRICING ═══ */}
        <View style={[styles.section, { backgroundColor: Colors.grey[50] }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>PRICING</Text>
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
              Simple, transparent pricing
            </Text>

            <View style={[styles.pricingRow, isDesktop && styles.pricingRowDesktop]}>
              {/* Free */}
              <View
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: Colors.white,
                    borderColor: Colors.grey[200],
                    flex: isDesktop ? 1 : undefined,
                    width: isDesktop ? undefined : '100%' as unknown as number,
                  },
                ]}
              >
                <Text style={styles.pricingTier}>Free</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>£0</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
                <Text style={styles.pricingSubtitle}>Get started with the basics</Text>
                <View style={styles.pricingDivider} />
                {FREE_FEATURES.map((feat) => (
                  <View key={feat} style={styles.pricingFeatureRow}>
                    <Text style={styles.checkMark}>✓</Text>
                    <Text style={styles.pricingFeatureText}>{feat}</Text>
                  </View>
                ))}
                <Link href="/(auth)/signup" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.pricingCTAOutline, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Get Started Free"
                  >
                    <Text style={styles.pricingCTAOutlineText}>Get Started</Text>
                  </Pressable>
                </Link>
              </View>

              {/* Pro */}
              <View
                style={[
                  styles.pricingCard,
                  styles.pricingCardPro,
                  {
                    flex: isDesktop ? 1 : undefined,
                    width: isDesktop ? undefined : '100%' as unknown as number,
                  },
                ]}
              >
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>MOST POPULAR</Text>
                </View>
                <Text style={[styles.pricingTier, { color: Colors.white }]}>Pro</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceAmount, { color: Colors.white }]}>£9.99</Text>
                  <Text style={[styles.pricePeriod, { color: 'rgba(255,255,255,0.7)' }]}>
                    /month
                  </Text>
                </View>
                <Text style={[styles.pricingSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                  or £89.99/year (save 2 months)
                </Text>
                <View style={[styles.pricingDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                {PRO_FEATURES.map((feat) => (
                  <View key={feat} style={styles.pricingFeatureRow}>
                    <Text style={[styles.checkMark, { color: Colors.gold[50] }]}>✓</Text>
                    <Text style={[styles.pricingFeatureText, { color: Colors.white }]}>{feat}</Text>
                  </View>
                ))}
                <Link href="/(auth)/signup" asChild>
                  <Pressable
                    style={({ pressed }) => [styles.ctaGold, { marginTop: Spacing.lg }, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Start Free Trial"
                  >
                    <Text style={styles.ctaGoldText}>Start Free Trial</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ SOCIAL PROOF ═══ */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>TESTIMONIALS</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trusted by 1,000+ UK sole traders
            </Text>

            <View style={[styles.testimonialsRow, isDesktop && styles.testimonialsRowDesktop]}>
              {TESTIMONIALS.map((t) => (
                <View
                  key={t.name}
                  style={[
                    styles.testimonialCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      flex: isDesktop ? 1 : undefined,
                      width: isDesktop ? undefined : '100%' as unknown as number,
                    },
                  ]}
                >
                  <Text style={[styles.testimonialQuote, { color: colors.text }]}>
                    &ldquo;{t.quote}&rdquo;
                  </Text>
                  <View style={styles.testimonialAuthor}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialAvatarText}>
                        {t.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.testimonialName, { color: colors.text }]}>{t.name}</Text>
                      <Text style={[styles.testimonialOccupation, { color: colors.textSecondary }]}>
                        {t.occupation}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══ FAQ ═══ */}
        <View style={[styles.section, { backgroundColor: Colors.grey[50] }]}>
          <View style={[styles.sectionInner, { maxWidth: 700 }]}>
            <Text style={[styles.sectionTag, { color: Colors.accent }]}>FAQ</Text>
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
              Frequently asked questions
            </Text>

            {FAQS.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </View>
        </View>

        {/* ═══ FINAL CTA ═══ */}
        <LinearGradient
          colors={['#0F172A', '#1E3A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.finalCTA}
        >
          <Text style={styles.finalCTATitle}>Ready to take control of your taxes?</Text>
          <Text style={styles.finalCTASubtitle}>
            Join thousands of UK sole traders who trust QuidSafe.
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable
              style={({ pressed }) => [styles.ctaGold, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Start Free Trial"
            >
              <Text style={styles.ctaGoldText}>Start Free Trial</Text>
            </Pressable>
          </Link>
        </LinearGradient>

        {/* ═══ FOOTER ═══ */}
        <View style={styles.footer}>
          <View style={[styles.footerInner, { maxWidth: contentMaxWidth }, isDesktop && styles.footerDesktop]}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>QuidSafe</Text>
              <Text style={styles.footerTagline}>Your tax. Sorted. Safe.</Text>
            </View>

            <View style={[styles.footerLinks, isDesktop && styles.footerLinksDesktop]}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerLinkDivider}>|</Text>
              <Text style={styles.footerLink}>Terms of Service</Text>
              <Text style={styles.footerLinkDivider}>|</Text>
              <Text style={styles.footerLink}>Contact</Text>
            </View>

            <View style={styles.footerBottom}>
              <Text style={styles.footerMade}>Made in the UK 🇬🇧</Text>
              <Text style={styles.footerCopyright}>© 2026 QuidSafe Ltd</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    paddingBottom: 60,
    overflow: 'hidden',
  },
  goldGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(202,138,4,0.08)',
    transform: [{ translateX: -200 }, { translateY: -200 }],
  },
  heroSafe: {
    alignItems: 'center',
    width: '100%',
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  navLogo: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 24,
    color: Colors.white,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navLoginBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  navLoginText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
  },
  heroHeadline: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 36,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 44,
  },
  heroHeadlineDesktop: {
    fontSize: 52,
    lineHeight: 64,
  },
  heroSubtitle: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 28,
  },
  heroSubtitleDesktop: {
    fontSize: 20,
    lineHeight: 32,
  },
  heroCTAs: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  heroCTAsDesktop: {
    flexDirection: 'row',
    maxWidth: 420,
  },
  ctaGold: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    width: '100%',
    ...Shadows.large,
  },
  ctaGoldText: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
    color: Colors.white,
  },
  ctaOutline: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    width: '100%',
  },
  ctaOutlineText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  // ── Trust Bar ──
  trustBar: {
    backgroundColor: '#0B1120',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  trustBarInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    width: '100%',
  },
  trustBarDesktop: {
    gap: Spacing.xxl,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trustIcon: {
    fontSize: 16,
  },
  trustLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Section ──
  section: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  sectionInner: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  sectionTag: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 36,
  },

  // ── Features ──
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  featuresGridDesktop: {
    gap: Spacing.lg,
  },
  featureCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    fontSize: 20,
    color: Colors.secondary,
  },
  featureTitle: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 17,
    marginBottom: Spacing.xs,
  },
  featureDesc: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Pricing ──
  pricingRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  pricingRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pricingCard: {
    borderRadius: BorderRadius.hero,
    borderWidth: 1,
    padding: Spacing.xl,
    maxWidth: 420,
    ...Shadows.medium,
  },
  pricingCardPro: {
    backgroundColor: Colors.primary,
    borderColor: Colors.secondary,
  },
  proBadge: {
    backgroundColor: Colors.accent,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  proBadgeText: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 11,
    color: Colors.white,
    letterSpacing: 1,
  },
  pricingTier: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 20,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  priceAmount: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 40,
    color: Colors.primary,
  },
  pricePeriod: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 16,
    color: Colors.grey[500],
    marginLeft: 4,
  },
  pricingSubtitle: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 14,
    color: Colors.grey[500],
    marginBottom: Spacing.md,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: Colors.grey[200],
    marginVertical: Spacing.md,
  },
  pricingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkMark: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
    color: Colors.success,
  },
  pricingFeatureText: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 15,
    color: Colors.grey[700],
  },
  pricingCTAOutline: {
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: Spacing.lg,
  },
  pricingCTAOutlineText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 16,
    color: Colors.primary,
  },

  // ── Testimonials ──
  testimonialsRow: {
    flexDirection: 'column',
    gap: Spacing.md,
    width: '100%',
  },
  testimonialsRowDesktop: {
    flexDirection: 'row',
  },
  testimonialCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  testimonialQuote: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 14,
    color: Colors.secondary,
  },
  testimonialName: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 14,
  },
  testimonialOccupation: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 12,
  },

  // ── FAQ ──
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    width: '100%',
    ...Shadows.soft,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 15,
    color: Colors.primary,
    flex: 1,
    paddingRight: Spacing.md,
  },
  faqChevron: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 20,
    color: Colors.accent,
  },
  faqAnswer: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.grey[600],
    marginTop: Spacing.md,
  },

  // ── Final CTA ──
  finalCTA: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  finalCTATitle: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  finalCTASubtitle: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // ── Footer ──
  footer: {
    backgroundColor: '#070B14',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  footerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  footerBrand: {
    alignItems: 'center',
  },
  footerLogo: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 22,
    color: Colors.white,
  },
  footerTagline: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLinksDesktop: {
    gap: Spacing.md,
  },
  footerLink: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  footerLinkDivider: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
  },
  footerBottom: {
    alignItems: 'center',
    gap: 4,
  },
  footerMade: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  footerCopyright: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
});

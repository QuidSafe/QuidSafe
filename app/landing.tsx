import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  Zap,
  TrendingUp,
  Lock,
  Check,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';

// ─── Data ────────────────────────────────────────────────

const NAV_SECTIONS = ['Features', 'Pricing', 'FAQ'] as const;
type SectionId = (typeof NAV_SECTIONS)[number];

const FEATURES = [
  {
    icon: Zap,
    title: 'Auto-categorised.',
    description:
      'Every transaction, sorted by AI. Trained on HMRC\u2019s own expense categories so you never have to guess what counts.',
  },
  {
    icon: TrendingUp,
    title: 'Always up to date.',
    description:
      'Your tax bill recalculates the moment money moves. No spreadsheets, no year-end surprises, just a number you can trust.',
  },
  {
    icon: Lock,
    title: 'Bank-grade secure.',
    description:
      'Read-only Open Banking via TrueLayer, FCA authorised. AES-256 encryption end to end. We can never move your money.',
  },
] as const;

const PRICING_INCLUDES = [
  'Unlimited bank connections via Open Banking',
  'AI-powered transaction categorisation',
  'Real-time Income Tax + NI calculator',
  'Making Tax Digital quarterly submissions',
  'Professional invoicing with PDF export',
] as const;

const FAQS = [
  {
    q: 'How much does QuidSafe cost?',
    a: 'QuidSafe is £7.99/month or £79.99/year (save 17%). All prices include VAT. Start with a 14-day free trial - no credit card required.',
  },
  {
    q: 'Is my bank data safe?',
    a: 'Yes. QuidSafe uses AES-256 encryption. Open Banking is regulated by the FCA via our provider TrueLayer, and we only ever have read-only access to your transactions. We can never move money or make payments from your account.',
  },
  {
    q: 'What is Making Tax Digital?',
    a: 'MTD for Income Tax requires sole traders to keep digital records and submit quarterly updates to HMRC. It becomes mandatory from April 2026 for income over £50,000 and April 2027 for income over £30,000. QuidSafe handles this automatically.',
  },
  {
    q: 'Which banks do you support?',
    a: 'All major UK banks through TrueLayer Open Banking, including Barclays, HSBC, Lloyds, NatWest, Monzo, Starling, Nationwide, Revolut, and many more.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel whenever you like from your settings - no questions, no retention calls. If you cancel during your trial you will not be charged a penny.',
  },
  {
    q: 'What happens to my data if I delete my account?',
    a: 'Your data is permanently deleted from our servers within 30 days of account deletion. You can also export all your data as CSV at any time before deleting.',
  },
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsiveLayout();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<SectionId, number>>({
    Features: 0,
    Pricing: 0,
    FAQ: 0,
  });
  const [scrollY] = useState(new Animated.Value(0));
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [annual, setAnnual] = useState(false);

  const onScroll = Animated.event<NativeScrollEvent>(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const scrollToSection = useCallback((id: SectionId) => {
    const y = sectionOffsets.current[id];
    scrollRef.current?.scrollTo({ y: y - 80, animated: true });
  }, []);

  const onLayoutSection = useCallback(
    (id: SectionId) => (e: { nativeEvent: { layout: { y: number } } }) => {
      sectionOffsets.current[id] = e.nativeEvent.layout.y;
    },
    [],
  );

  // Responsive hero type - clamp for 768-900 range
  const heroFontSize = isDesktop ? Math.min(96, width * 0.11) : 56;

  // Nav blur/fade based on scroll
  const navBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)'],
    extrapolate: 'clamp',
  });
  const navBorder = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(42,42,42,0)', 'rgba(42,42,42,1)'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.root}>
      {/* ── Sticky Nav ── */}
      <Animated.View
        style={[
          s.nav,
          {
            backgroundColor: navBg,
            borderBottomColor: navBorder,
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' as never } : {}),
          },
        ]}
      >
        <View style={[s.navInner, { maxWidth: 1120 }]}>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
            <BrandLogo size={28} textSize={18} />
          </Pressable>

          {isDesktop && (
            <View style={s.navLinks}>
              {NAV_SECTIONS.map((section) => (
                <Pressable key={section} onPress={() => scrollToSection(section)}>
                  <Text style={s.navLink}>{section}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={s.navCtas}>
            {isDesktop && (
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => pressed && s.pressed}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <Text style={s.navSignIn}>Sign in</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [s.navCta, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Start free trial"
            >
              <Text style={s.navCtaText}>Start free</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef as unknown as React.Ref<Animated.LegacyRef<ScrollView>>}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={['top']} style={s.safeArea}>
          {/* ── Hero ── */}
          <View style={[s.hero, { minHeight: isDesktop ? 720 : 560 }]}>
            {/* Subtle radial glow */}
            <View style={s.heroGlow} />

            <View style={[s.heroContent, isDesktop && s.heroContentDesktop]}>
              <Text
                style={[
                  s.heroTitle,
                  {
                    fontSize: heroFontSize,
                    lineHeight: heroFontSize * 0.95,
                    textAlign: isDesktop ? 'center' : 'left',
                  },
                ]}
              >
                Tax,{'\n'}sorted.
              </Text>

              <Text style={[s.heroSub, { textAlign: isDesktop ? 'center' : 'left' }]}>
                The smartest way for UK sole traders to track income, expenses and tax - all in one place.
              </Text>

              <View style={[s.heroCtas, isDesktop && s.heroCtasDesktop]}>
                <Pressable
                  onPress={() => router.push('/(auth)/signup')}
                  style={({ pressed }) => [s.primaryCta, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Start 14-day free trial"
                >
                  <Text style={s.primaryCtaText}>Start 14-day free trial</Text>
                  <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(auth)/login')}
                  style={({ pressed }) => [s.ghostCta, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Text style={s.ghostCtaText}>Sign in</Text>
                </Pressable>
              </View>

              <Text style={[s.heroLegal, { textAlign: isDesktop ? 'center' : 'left' }]}>
                No credit card. Cancel anytime. £7.99/mo inc. VAT.
              </Text>
            </View>
          </View>

          {/* ── Features (3 rows) ── */}
          <View style={s.section} onLayout={onLayoutSection('Features')}>
            <View style={[s.sectionInner, { maxWidth: 1120 }]}>
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                const isEven = i % 2 === 0;
                return (
                  <View
                    key={feat.title}
                    style={[
                      s.featureRow,
                      isDesktop && (isEven ? s.featureRowLeft : s.featureRowRight),
                    ]}
                  >
                    <View style={s.featureIconWrap}>
                      <Icon size={28} color={Colors.electricBlue} strokeWidth={1.5} />
                    </View>
                    <View style={s.featureText}>
                      <Text
                        style={[
                          s.featureTitle,
                          { textAlign: isDesktop ? (isEven ? 'left' : 'right') : 'center' },
                        ]}
                      >
                        {feat.title}
                      </Text>
                      <Text
                        style={[
                          s.featureDescription,
                          { textAlign: isDesktop ? (isEven ? 'left' : 'right') : 'center' },
                        ]}
                      >
                        {feat.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Pricing ── */}
          <View style={s.section} onLayout={onLayoutSection('Pricing')}>
            <View style={[s.sectionInner, { maxWidth: 640 }]}>
              <Text style={s.sectionTag}>PRICING</Text>
              <Text style={s.sectionHead}>One plan. Everything included.</Text>

              {/* Billing toggle */}
              <View style={s.toggle}>
                <Pressable
                  onPress={() => setAnnual(false)}
                  style={[s.toggleOption, !annual && s.toggleOptionActive]}
                >
                  <Text style={[s.toggleText, !annual && s.toggleTextActive]}>Monthly</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAnnual(true)}
                  style={[s.toggleOption, annual && s.toggleOptionActive]}
                >
                  <Text style={[s.toggleText, annual && s.toggleTextActive]}>
                    Yearly <Text style={s.toggleSave}>save 17%</Text>
                  </Text>
                </Pressable>
              </View>

              {/* Price */}
              <View style={s.priceRow}>
                <Text style={s.priceCurrency}>£</Text>
                <Text style={s.priceAmount}>{annual ? '79.99' : '7.99'}</Text>
                <Text style={s.pricePeriod}>/{annual ? 'year' : 'month'}</Text>
              </View>

              {/* Inclusions */}
              <View style={s.inclusions}>
                {PRICING_INCLUDES.map((item) => (
                  <View key={item} style={s.inclusionRow}>
                    <View style={s.checkCircle}>
                      <Check size={14} color={Colors.electricBlue} strokeWidth={2} />
                    </View>
                    <Text style={s.inclusionText}>{item}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                style={({ pressed }) => [s.primaryCta, s.priceCta, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Start 14-day free trial"
              >
                <Text style={s.primaryCtaText}>Start 14-day free trial</Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
              </Pressable>

              <Text style={s.priceLegal}>
                All prices include VAT. VAT-registered? Reclaim it as a business expense.
              </Text>
            </View>
          </View>

          {/* ── FAQ ── */}
          <View style={s.section} onLayout={onLayoutSection('FAQ')}>
            <View style={[s.sectionInner, { maxWidth: 720 }]}>
              <Text style={[s.sectionHead, { textAlign: 'center', marginBottom: 48 }]}>Questions?</Text>

              {FAQS.map((faq, i) => (
                <FAQItem
                  key={faq.q}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </View>
          </View>

          {/* ── Closing CTA ── */}
          <View style={[s.section, s.ctaBand]}>
            <Text style={[s.ctaBandTitle, isDesktop && { fontSize: 56, lineHeight: 60 }]}>
              Ready when you are.
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [s.primaryCta, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Start 14-day free trial"
            >
              <Text style={s.primaryCtaText}>Start 14-day free trial</Text>
              <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <View style={[s.footerInner, { maxWidth: 1120 }, isDesktop && s.footerInnerDesktop]}>
              <View style={s.footerBrand}>
                <BrandLogo size={24} textSize={16} />
                <Text style={s.footerTagline}>Tax tracking for UK sole traders.</Text>
              </View>

              <View style={s.footerLinks}>
                <Pressable onPress={() => router.push('/about')}>
                  <Text style={s.footerLink}>About</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/terms')}>
                  <Text style={s.footerLink}>Terms</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/privacy')}>
                  <Text style={s.footerLink}>Privacy</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/cookie-policy')}>
                  <Text style={s.footerLink}>Cookies</Text>
                </Pressable>
              </View>
            </View>

            <Text style={s.footerLegal}>
              QuidSafe is a tax tracking tool, not a financial adviser. Open Banking by TrueLayer Ltd (FCA authorised).
            </Text>
            <Text style={s.footerCopyright}>© 2026 QuidSafe Ltd. All rights reserved.</Text>
          </View>
        </SafeAreaView>
      </Animated.ScrollView>
    </View>
  );
}

// ─── FAQ Item ────────────────────────────────────────────

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [s.faqItem, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
    >
      <View style={s.faqHeader}>
        <Text style={s.faqQuestion}>{question}</Text>
        {isOpen ? (
          <Minus size={20} color={Colors.lightGrey} strokeWidth={1.5} />
        ) : (
          <Plus size={20} color={Colors.lightGrey} strokeWidth={1.5} />
        )}
      </View>
      {isOpen && <Text style={s.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },

  // Nav
  nav: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  navInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%' as unknown as number,
    alignSelf: 'center' as const,
  },
  navLinks: {
    flexDirection: 'row' as const,
    gap: 32,
    position: 'absolute' as const,
    left: 0,
    right: 0,
    justifyContent: 'center' as const,
  },
  navLink: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: Colors.lightGrey,
  },
  navCtas: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  navSignIn: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
  navCta: {
    backgroundColor: Colors.electricBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navCtaText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },

  // Scroll
  scrollContent: { paddingBottom: 0 },
  safeArea: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 120,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  heroGlow: {
    position: 'absolute' as const,
    top: -300,
    left: -200,
    width: 800,
    height: 800,
    borderRadius: 400,
    backgroundColor: Colors.electricBlue,
    opacity: 0.08,
  },
  heroContent: {
    maxWidth: 960,
    width: '100%' as unknown as number,
    zIndex: 1,
  },
  heroContentDesktop: {
    alignItems: 'center' as const,
  },
  heroTitle: {
    fontFamily: Fonts.lexend.semiBold,
    color: Colors.white,
    letterSpacing: -3,
    marginBottom: 28,
  },
  heroSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 20,
    lineHeight: 30,
    color: Colors.lightGrey,
    marginBottom: 40,
    maxWidth: 560,
  },
  heroCtas: {
    flexDirection: 'row' as const,
    gap: 16,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  heroCtasDesktop: {
    justifyContent: 'center' as const,
  },
  heroLegal: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.muted,
  },

  // CTAs
  primaryCta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.electricBlue,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 10,
  },
  primaryCtaText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  ghostCta: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  ghostCtaText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    paddingVertical: 96,
  },
  sectionInner: {
    width: '100%' as unknown as number,
    alignSelf: 'center' as const,
  },
  sectionTag: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.electricBlue,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  sectionHead: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: -1,
    marginBottom: 32,
  },

  // Features
  featureRow: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 24,
    paddingVertical: 48,
  },
  featureRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    gap: 48,
  },
  featureRowRight: {
    flexDirection: 'row-reverse' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    gap: 48,
  },
  featureIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    maxWidth: 520,
  },
  featureTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 44,
    lineHeight: 48,
    color: Colors.white,
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  featureDescription: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.lightGrey,
  },

  // Pricing
  toggle: {
    flexDirection: 'row' as const,
    alignSelf: 'center' as const,
    backgroundColor: Colors.charcoal,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    marginBottom: 32,
  },
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toggleOptionActive: {
    backgroundColor: Colors.electricBlue,
  },
  toggleText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    color: Colors.lightGrey,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  toggleSave: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.85,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
    marginBottom: 40,
  },
  priceCurrency: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 40,
    color: Colors.white,
    marginTop: 12,
  },
  priceAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 88,
    lineHeight: 88,
    color: Colors.white,
    letterSpacing: -3,
  },
  pricePeriod: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 18,
    color: Colors.lightGrey,
    marginTop: 44,
    marginLeft: 4,
  },
  inclusions: {
    gap: 16,
    marginBottom: 40,
    alignSelf: 'center' as const,
  },
  inclusionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.blueGlow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  inclusionText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    color: Colors.white,
  },
  priceCta: {
    alignSelf: 'center' as const,
    marginBottom: 16,
  },
  priceLegal: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center' as const,
  },

  // FAQ
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.midGrey,
    paddingVertical: 24,
  },
  faqHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 16,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  faqAnswer: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.lightGrey,
    marginTop: 16,
  },

  // Closing CTA band
  ctaBand: {
    alignItems: 'center' as const,
    gap: 32,
    paddingVertical: 96,
  },
  ctaBandTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.white,
    textAlign: 'center' as const,
    letterSpacing: -1.2,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.midGrey,
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 16,
  },
  footerInner: {
    width: '100%' as unknown as number,
    alignSelf: 'center' as const,
    gap: 24,
  },
  footerInnerDesktop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  footerBrand: {
    gap: 8,
  },
  footerTagline: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.muted,
  },
  footerLinks: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 24,
  },
  footerLink: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.lightGrey,
  },
  footerLegal: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.muted,
    textAlign: 'center' as const,
    maxWidth: 720,
    alignSelf: 'center' as const,
    marginTop: 16,
  },
  footerCopyright: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center' as const,
  },

  pressed: { opacity: 0.85 },
});

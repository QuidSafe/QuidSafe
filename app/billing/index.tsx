import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl, Linking, Alert } from 'react-native';
import { BrandSpinner } from '@/components/ui/ProgressRing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronUp, ChevronDown, Check, CheckCircle, Shield, Lock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors, Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { api } from '@/lib/api';
import { useBillingStatus, useCreateCheckout } from '@/lib/hooks/useApi';

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: '7.99',
    interval: '/month',
    description: 'Flexible - cancel anytime',
  },
  {
    id: 'annual' as const,
    name: 'Annual',
    price: '79.99',
    interval: '/year',
    description: 'Save 17% - best value',
    badge: 'BEST VALUE',
  },
];

const PRO_FEATURES = [
  { icon: 'bank' as const, text: 'Automatic bank sync via Open Banking' },
  { icon: 'magic' as const, text: 'AI-powered transaction categorisation' },
  { icon: 'file-text-o' as const, text: 'One-tap HMRC Self Assessment submission' },
  { icon: 'bell' as const, text: 'Tax deadline reminders & alerts' },
  { icon: 'line-chart' as const, text: 'Quarterly income & expense breakdown' },
  { icon: 'shield' as const, text: 'Bank-grade AES-256 encryption' },
];

const SUPPORTED_BANKS = ['Barclays', 'HSBC', 'Lloyds', 'NatWest', 'Monzo', 'Starling', 'Revolut', 'Nationwide'];

const COMPETITORS = [
  { name: 'QuidSafe', price: '£7.99/mo', highlight: true },
  { name: 'FreeAgent', price: '£24/mo', highlight: false },
  { name: 'QuickBooks', price: '£12/mo', highlight: false },
  { name: 'Xero', price: '£15/mo', highlight: false },
];

const FAQ_ITEMS = [
  {
    question: 'What happens after my free trial?',
    answer: "You'll be asked to subscribe. No auto-charge.",
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. No contracts, no cancellation fees.',
  },
  {
    question: 'Is my payment data secure?',
    answer: 'Yes. Payments processed by Stripe with PCI DSS compliance.',
  },
  {
    question: "What's included?",
    answer: 'Everything. AI categorisation, MTD submissions, unlimited banks, invoicing, expenses.',
  },
  {
    question: 'Can I switch between monthly and annual?',
    answer: 'Yes, anytime from your account settings.',
  },
];

function FAQItem({ question, answer, colors }: { question: string; answer: string; colors: { text: string; textSecondary: string; border: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={question}
      accessibilityState={{ expanded }}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
        {expanded ? <ChevronUp size={12} color={colors.textSecondary} strokeWidth={1.5} /> : <ChevronDown size={12} color={colors.textSecondary} strokeWidth={1.5} />}
      </View>
      {expanded && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
      )}
    </Pressable>
  );
}

export default function BillingScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: status, refetch, isRefetching } = useBillingStatus();
  const checkoutMutation = useCreateCheckout();

  const isSubscribed = status?.status === 'active' || status?.status === 'trialing';

  const trialDaysRemaining = (() => {
    if (status?.status !== 'trialing' || !status.trialEndsAt) return null;
    const now = new Date();
    const end = new Date(status.trialEndsAt);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  })();

  const handleCheckout = () => {
    checkoutMutation.mutate(selectedPlan, {
      onSuccess: async ({ url }) => {
        await Linking.openURL(url);
      },
      onError: (err) => {
        Alert.alert('Checkout failed', err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      },
    });
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.createPortalSession();
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open subscription management.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text} />}
        >
          <View style={styles.webWrap}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={16} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Your Plan</Text>

          <Card>
            <View style={styles.activeRow}>
              <View style={styles.activeBadge}>
                <CheckCircle size={16} color={Colors.success} strokeWidth={1.5} />
                <Text style={styles.activeBadgeText}>
                  {status?.status === 'trialing' ? 'Free Trial' : 'Pro'}
                </Text>
              </View>
              <Text style={[styles.planName, { color: colors.textSecondary }]}>{status?.plan === 'pro_annual' ? 'Annual' : 'Monthly'}</Text>
            </View>
            {status?.status === 'trialing' && trialDaysRemaining !== null && (
              <Text style={styles.trialText}>
                {trialDaysRemaining === 0
                  ? 'Your trial ends today'
                  : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} remaining in your trial`}
              </Text>
            )}
            {status?.trialEndsAt && (
              <Text style={[styles.periodText, { color: colors.textSecondary }]}>
                Trial ends {new Date(status.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
            {status?.currentPeriodEnd && status?.status !== 'trialing' && (
              <Text style={[styles.periodText, { color: colors.textSecondary }]}>
                Next billing: {new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </Card>

          <Pressable style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]} onPress={handleManage} accessibilityRole="button" accessibilityLabel="Manage Subscription" accessibilityHint="Tap to manage your subscription in the Stripe portal">
            {portalLoading ? (
              <BrandSpinner size={18} color={colors.text} />
            ) : (
              <Text style={[styles.manageText, { color: colors.text }]}>Manage Subscription</Text>
            )}
          </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text} />}
      >
        <View style={styles.webWrap}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={16} color={colors.text} strokeWidth={1.5} />
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Go Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Everything you need to stay on top of your sole trader taxes.
          </Text>
        </View>

        {/* Plan Selection */}
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={({ pressed }) => [
                styles.planCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedPlan === plan.id && { borderColor: Colors.accent },
                selectedPlan === plan.id && { shadowColor: Colors.accent, shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              accessibilityRole="button"
              accessibilityLabel={`${plan.name} plan: ${plan.price} pounds ${plan.interval}. ${plan.description}`}
              accessibilityState={{ selected: selectedPlan === plan.id }}
            >
              {plan.badge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.radioRow}>
                <View style={[styles.radio, { borderColor: colors.textSecondary }, selectedPlan === plan.id && styles.radioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.planCardName, { color: colors.text }]}>{plan.name}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.currency, { color: colors.text }]}>{'\u00A3'}</Text>
                <Text style={[styles.price, { color: colors.text }]}>{plan.price}</Text>
                <Text style={[styles.interval, { color: colors.textSecondary }]}>{plan.interval}</Text>
              </View>
              {/* Strikethrough price anchor for annual plan */}
              {plan.id === 'annual' && (
                <View style={styles.strikethroughRow}>
                  <Text style={[styles.strikethroughPrice, { color: colors.textSecondary }]}>
                    {'\u00A3'}7.99/mo
                  </Text>
                  <Text style={[styles.equivalentPrice, { color: Colors.accent }]}>
                    {'\u00A3'}5.00/mo
                  </Text>
                </View>
              )}
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* VAT note - CLAUDE.md rule: prices shown inclusive of VAT */}
        <Text style={[styles.vatNote, { color: colors.textSecondary }]}>
          All prices include VAT. VAT-registered sole traders can reclaim VAT on their QuidSafe subscription.
        </Text>

        {/* Features */}
        <Card>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Everything in Pro</Text>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Check size={12} color={Colors.success} strokeWidth={1.5} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </Card>

        {/* Competitor Comparison */}
        <Card>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>How we compare</Text>
          <View style={styles.comparisonGrid}>
            {COMPETITORS.map((comp, i) => (
              <View
                key={i}
                style={[
                  styles.comparisonRow,
                  comp.highlight && styles.comparisonRowHighlight,
                  i < COMPETITORS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.comparisonNameCol}>
                  <Text style={[
                    styles.comparisonName,
                    { color: comp.highlight ? Colors.accent : colors.text },
                    comp.highlight && { fontFamily: Fonts.sourceSans.semiBold },
                  ]}>
                    {comp.name}
                  </Text>
                </View>
                <View style={styles.comparisonPriceCol}>
                  <Text style={[
                    styles.comparisonPrice,
                    { color: comp.highlight ? Colors.accent : colors.textSecondary },
                    comp.highlight && { fontFamily: Fonts.sourceSans.semiBold },
                  ]}>
                    {comp.price}
                  </Text>
                  {comp.highlight && (
                    <Check size={12} color={Colors.success} strokeWidth={1.5} style={{ marginLeft: 6 }} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
          onPress={handleCheckout}
          disabled={checkoutMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Start 30-day free trial"
          accessibilityHint="Tap to start the checkout process for your free trial"
        >
          {checkoutMutation.isPending ? (
            <BrandSpinner size={20} color={Colors.white} />
          ) : (
            <View style={[styles.ctaGradient, { backgroundColor: '#0066FF' }]}>
              <Text style={styles.ctaText}>Start 30-day free trial</Text>
            </View>
          )}
        </Pressable>

        {/* No commitment line */}
        <Text style={[styles.noCommitmentText, { color: colors.textSecondary }]}>
          No commitment  ·  Cancel anytime  ·  Your data is always yours
        </Text>

        {/* Security badge */}
        <View style={[styles.securityBadge, { borderColor: colors.border }]}>
          <Lock size={14} color={Colors.success} strokeWidth={1.5} />
          <Text style={[styles.securityBadgeText, { color: colors.textSecondary }]}>
            256-bit encrypted checkout
          </Text>
        </View>

        <Text style={[styles.trialNote, { color: colors.textSecondary }]}>
          No charge until your trial ends. Cancel anytime.
        </Text>

        <View style={[styles.guaranteeBadge, { borderColor: colors.border }]}>
          <Shield size={14} color={Colors.success} strokeWidth={1.5} />
          <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
            30-day money-back guarantee  ·  Cancel anytime  ·  Secure checkout
          </Text>
        </View>

        {/* Bank Logo Strip */}
        <View style={styles.bankStripSection}>
          <Text style={[styles.bankStripLabel, { color: colors.textSecondary }]}>
            Works with your bank
          </Text>
          <View style={styles.bankStrip}>
            {SUPPORTED_BANKS.map((bank) => (
              <View key={bank} style={[styles.bankPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.bankPillText, { color: colors.text }]}>{bank}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqTitle, { color: colors.text }]}>Frequently asked questions</Text>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.question} answer={item.answer} colors={colors} />
          ))}
        </View>

        <Text style={[styles.restoreNote, { color: colors.textSecondary }]}>
          Already subscribed? Pull down to refresh.
        </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  webWrap: {
    width: '100%' as unknown as number,
    maxWidth: 540,
    alignSelf: 'center' as const,
    gap: Spacing.md,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  header: { marginTop: Spacing.sm },
  title: { fontFamily: Fonts.lexend.semiBold, fontSize: 28 },
  subtitle: { fontFamily: Fonts.sourceSans.regular, fontSize: 15, marginTop: Spacing.xs, lineHeight: 22 },

  plans: { flexDirection: 'row', gap: Spacing.sm },
  planCard: { flex: 1, borderRadius: BorderRadius.card, padding: Spacing.md, borderWidth: 2, ...Shadows.soft },
  badgeContainer: { position: 'absolute', top: -10, right: 12, backgroundColor: Colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill, ...Shadows.soft },
  badgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 9, color: Colors.white, letterSpacing: 0.8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  planCardName: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 15 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm },
  currency: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 16 },
  price: { fontFamily: Fonts.mono.semiBold, fontSize: 28 },
  interval: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, marginLeft: 2 },
  strikethroughRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  strikethroughPrice: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, textDecorationLine: 'line-through' },
  equivalentPrice: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13 },
  planDesc: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 18, marginTop: Spacing.xs },
  vatNote: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },

  featuresTitle: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 16, lineHeight: 22, marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm + 2 },
  featureIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 21, flex: 1 },

  comparisonGrid: {},
  comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2 },
  comparisonRowHighlight: { backgroundColor: Colors.accent + '10', marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.input },
  comparisonNameCol: { flex: 1 },
  comparisonName: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 20 },
  comparisonPriceCol: { flexDirection: 'row', alignItems: 'center' },
  comparisonPrice: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, lineHeight: 20 },

  ctaButton: { borderRadius: BorderRadius.button, overflow: 'hidden' as const, ...Shadows.large },
  ctaGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  ctaText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 16, color: Colors.white },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  noCommitmentText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 18, textAlign: 'center' },

  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.pill, borderWidth: 1 },
  securityBadgeText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 18 },

  trialNote: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  guaranteeBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.pill, borderWidth: 1, justifyContent: 'center' },
  guaranteeText: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', flex: 1 },

  bankStripSection: { alignItems: 'center', gap: Spacing.sm },
  bankStripLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, lineHeight: 16, textTransform: 'uppercase', letterSpacing: 1 },
  bankStrip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.xs },
  bankPill: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 1, borderRadius: BorderRadius.pill, borderWidth: 1 },
  bankPillText: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, lineHeight: 16 },

  faqSection: { gap: 0, marginTop: Spacing.sm },
  faqTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 20, marginBottom: Spacing.md },
  faqItem: { borderBottomWidth: 1, paddingVertical: Spacing.md },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, flex: 1, marginRight: Spacing.sm },
  faqAnswer: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, marginTop: Spacing.sm, lineHeight: 20 },

  restoreNote: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, textAlign: 'center', marginTop: Spacing.sm },

  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.pill },
  activeBadgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.success },
  planName: { fontFamily: Fonts.sourceSans.regular, fontSize: 14 },
  trialText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: Colors.accent, marginTop: Spacing.sm },
  periodText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, marginTop: Spacing.xs },
  manageButton: { paddingVertical: 14, borderRadius: BorderRadius.button, alignItems: 'center', borderWidth: 1 },
  manageText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 15 },
});

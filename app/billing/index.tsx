import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, CheckCircle, Shield, Lock, Zap, TrendingUp, FileText, Receipt, Download, ArrowRight } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { api } from '@/lib/api';
import { useBillingStatus, useCreateCheckout } from '@/lib/hooks/useApi';

const FEATURES = [
  { Icon: Zap, text: 'AI auto-categorisation' },
  { Icon: TrendingUp, text: 'Live tax calculation' },
  { Icon: FileText, text: 'MTD quarterly submissions' },
  { Icon: Receipt, text: 'Professional invoicing' },
  { Icon: Download, text: 'CSV export for your accountant' },
  { Icon: Lock, text: 'Bank-grade AES-256 encryption' },
  { Icon: Shield, text: 'Unlimited bank accounts' },
];

const FAQ_ITEMS = [
  {
    q: 'What happens after my free trial?',
    a: "Your card will be charged at the plan rate you selected. You'll get a reminder email 3 days before. Cancel anytime in 2 clicks from Settings.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel from Settings in 2 clicks.',
  },
  {
    q: 'What can I do during the trial?',
    a: 'Everything except submit to HMRC and export CSV. Connect your bank, see your live tax number, categorise transactions. Upgrade to unlock submissions and exports.',
  },
  {
    q: "What's included in the paid plan?",
    a: 'Everything. AI categorisation, MTD submissions, unlimited banks, invoicing, CSV export, email support.',
  },
  {
    q: 'Can I switch between monthly and annual?',
    a: 'Yes, anytime from the Stripe subscription portal. Proration is automatic.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[s.faqItem, expanded && s.faqItemExpanded]}
      accessibilityRole="button"
      accessibilityLabel={q}
      accessibilityState={{ expanded }}
    >
      <Text style={s.faqQ}>{q}</Text>
      {expanded && <Text style={s.faqA}>{a}</Text>}
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
    const diff = Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  })();

  const handleCheckout = () => {
    checkoutMutation.mutate(selectedPlan, {
      onSuccess: async ({ url }) => { await Linking.openURL(url); },
      onError: (err) => {
        Alert.alert('Checkout failed', err instanceof Error ? err.message : 'Something went wrong.');
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

  // ─── Subscribed state ──────────────────────────────────
  if (isSubscribed) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text} />}>
          <View style={s.wrap}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
            </Pressable>

            <Text style={s.title} accessibilityRole="header">Your Plan</Text>

            <View style={s.activeCard}>
              <View style={s.activeHeader}>
                <View style={s.activeBadge}>
                  <CheckCircle size={14} color={Colors.success} strokeWidth={2} />
                  <Text style={s.activeBadgeText}>
                    {status?.status === 'trialing' ? 'Free Trial' : 'QuidSafe Pro'}
                  </Text>
                </View>
                <Text style={s.activePlan}>{status?.plan === 'pro_annual' ? 'Annual' : 'Monthly'}</Text>
              </View>

              {status?.status === 'trialing' && trialDaysRemaining !== null && (
                <View style={s.trialBanner}>
                  <Text style={s.trialBannerText}>
                    {trialDaysRemaining === 0
                      ? 'Your trial ends today - upgrade to keep access'
                      : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your trial`}
                  </Text>
                </View>
              )}

              {status?.currentPeriodEnd && status?.status !== 'trialing' && (
                <Text style={s.periodText}>
                  Next billing: {new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>

            <Pressable style={({ pressed }) => [s.manageBtn, pressed && s.pressed]} onPress={handleManage} accessibilityRole="button" accessibilityLabel="Manage subscription">
              {portalLoading ? <ActivityIndicator color={colors.text} /> : <Text style={s.manageBtnText}>Manage subscription</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Paywall (not subscribed) ──────────────────────────
  const price = selectedPlan === 'annual' ? '79.99' : '7.99';
  const interval = selectedPlan === 'annual' ? '/year' : '/month';
  const saveLine = selectedPlan === 'annual' ? 'Save 17% vs monthly' : 'Cancel anytime';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text} />}>
        <View style={s.wrap}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>

          {/* Header */}
          <Text style={s.eyebrow}>UPGRADE</Text>
          <Text style={s.title} accessibilityRole="header">Unlock everything.</Text>
          <Text style={s.subtitle}>30-day free trial. Card required. Cancel in 2 clicks.</Text>

          {/* Plan toggle */}
          <View style={s.toggleWrap}>
            <Pressable
              onPress={() => setSelectedPlan('monthly')}
              style={[s.toggleOpt, selectedPlan === 'monthly' && s.toggleOptActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPlan === 'monthly' }}
            >
              <Text style={[s.toggleText, selectedPlan === 'monthly' && s.toggleTextActive]}>Monthly</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedPlan('annual')}
              style={[s.toggleOpt, selectedPlan === 'annual' && s.toggleOptActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPlan === 'annual' }}
            >
              <Text style={[s.toggleText, selectedPlan === 'annual' && s.toggleTextActive]}>Yearly</Text>
              <View style={s.saveBadge}><Text style={s.saveBadgeText}>SAVE 17%</Text></View>
            </Pressable>
          </View>

          {/* Price card */}
          <View style={s.priceCard}>
            <Text style={s.priceEyebrow}>QUIDSAFE PRO</Text>
            <View style={s.priceRow}>
              <Text style={s.priceCurrency}>£</Text>
              <Text style={s.priceBig}>{price}</Text>
              <Text style={s.priceInterval}>{interval}</Text>
            </View>
            <Text style={s.priceSave}>{saveLine}</Text>
          </View>

          {/* Features */}
          <View style={s.featuresCard}>
            <Text style={s.featuresTitle}>Everything included</Text>
            {FEATURES.map(({ Icon, text }) => (
              <View key={text} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Icon size={14} color={Colors.electricBlue} strokeWidth={1.5} />
                </View>
                <Text style={s.featureText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [s.ctaBtn, pressed && s.pressed]}
            onPress={handleCheckout}
            disabled={checkoutMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Start 30 day free trial"
          >
            {checkoutMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={s.ctaBtnText}>Start 30-day free trial</Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2} />
              </>
            )}
          </Pressable>

          <Text style={s.finePrint}>
            Card required. No charge for 30 days. Cancel anytime in 2 clicks. Prices include VAT. VAT-registered traders can reclaim.
          </Text>

          {/* Trust signals */}
          <View style={s.trustRow}>
            <View style={s.trustChip}>
              <Lock size={11} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={s.trustText}>Secure checkout</Text>
            </View>
            <View style={s.trustChip}>
              <Shield size={11} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={s.trustText}>FCA Open Banking</Text>
            </View>
          </View>

          {/* What's locked during trial */}
          <View style={s.trialGateCard}>
            <Text style={s.trialGateTitle}>What's free in your trial</Text>
            {[
              ['Dashboard, live tax number, bank sync', true],
              ['AI transaction categorisation', true],
              ['View MTD obligations', true],
              ['Submit MTD to HMRC', false],
              ['Email invoices to clients', false],
              ['Export CSV', false],
            ].map(([label, free]) => (
              <View key={label as string} style={s.trialGateRow}>
                {free ? (
                  <Check size={13} color={Colors.success} strokeWidth={2} />
                ) : (
                  <Lock size={13} color={colors.textMuted} strokeWidth={1.5} />
                )}
                <Text style={[s.trialGateText, !free && s.trialGateTextLocked]}>{label as string}</Text>
                {!free && <Text style={s.trialGateUnlock}>Pro</Text>}
              </View>
            ))}
          </View>

          {/* FAQ */}
          <View style={s.faqSection}>
            <Text style={s.faqTitle}>Common questions</Text>
            {FAQ_ITEMS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  wrap: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: Spacing.md },

  eyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.4, marginTop: Spacing.md },
  title: { fontFamily: Fonts.lexend.semiBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: Colors.white },
  subtitle: { fontFamily: Fonts.sourceSans.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  // Toggle
  toggleWrap: {
    flexDirection: 'row', gap: 4, backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 4,
    alignSelf: 'flex-start', marginTop: Spacing.sm,
  },
  toggleOpt: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  toggleOptActive: { backgroundColor: Colors.electricBlue },
  toggleText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.textSecondary },
  toggleTextActive: { color: Colors.white },
  saveBadge: { backgroundColor: 'rgba(0,200,83,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  saveBadgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 9, color: Colors.success, letterSpacing: 0.5 },

  // Price card
  priceCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.electricBlue,
    borderRadius: 16, padding: Spacing.lg,
  },
  priceEyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 10, color: Colors.electricBlue, letterSpacing: 1.2, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceCurrency: { fontFamily: Fonts.lexend.semiBold, fontSize: 24, color: Colors.white },
  priceBig: { fontFamily: Fonts.mono.semiBold, fontSize: 56, color: Colors.white, letterSpacing: -2 },
  priceInterval: { fontFamily: Fonts.sourceSans.regular, fontSize: 15, color: colors.textSecondary, marginLeft: 4 },
  priceSave: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: Colors.success, marginTop: 4 },

  // Features
  featuresCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg, gap: 12,
  },
  featuresTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 26, height: 26, borderRadius: 6, backgroundColor: Colors.blueGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: colors.text, flex: 1 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.electricBlue, paddingVertical: 16, borderRadius: 10,
  },
  ctaBtnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 15, color: Colors.white },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

  finePrint: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted, textAlign: 'center' },

  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  trustChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  trustText: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textSecondary },

  // Trial gate info
  trialGateCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: Spacing.lg, gap: 10,
  },
  trialGateTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 14, color: Colors.white, marginBottom: 4 },
  trialGateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trialGateText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.text, flex: 1 },
  trialGateTextLocked: { color: colors.textMuted },
  trialGateUnlock: {
    fontFamily: Fonts.sourceSans.semiBold, fontSize: 9, color: Colors.electricBlue,
    backgroundColor: Colors.blueGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    letterSpacing: 0.5,
  },

  // FAQ
  faqSection: { gap: 2 },
  faqTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: Spacing.sm },
  faqItem: {
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: Spacing.md,
  },
  faqItemExpanded: { paddingBottom: Spacing.md },
  faqQ: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: colors.text },
  faqA: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },

  // Active subscription state
  activeCard: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.electricBlue,
    borderRadius: 12, padding: Spacing.lg,
  },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeBadgeText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.success },
  activePlan: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary },
  trialBanner: {
    marginTop: Spacing.md, backgroundColor: 'rgba(255,149,0,0.1)', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  trialBannerText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.warning },
  periodText: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary, marginTop: Spacing.sm },
  manageBtn: {
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  manageBtnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: colors.text },
});

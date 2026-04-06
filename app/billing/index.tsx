import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useApiToken } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: '9.99',
    interval: '/month',
    description: 'Flexible — cancel anytime',
  },
  {
    id: 'annual' as const,
    name: 'Annual',
    price: '89.99',
    interval: '/year',
    description: 'Save 25% — best value',
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

export default function BillingScreen() {
  useApiToken();
  const { colors, isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.getBillingStatus(),
  });

  const isSubscribed = status?.status === 'active' || status?.status === 'trialing';

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { url } = await api.createCheckout(selectedPlan);
      await Linking.openURL(url);
    } catch (err) {
      console.error('Stripe checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const { url } = await api.createPortalSession();
      await Linking.openURL(url);
    } catch (err) {
      console.error('Stripe portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
            <FontAwesome name="arrow-left" size={16} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Your Plan</Text>

          <Card>
            <View style={styles.activeRow}>
              <View style={styles.activeBadge}>
                <FontAwesome name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.activeBadgeText}>
                  {status?.status === 'trialing' ? 'Free Trial' : 'Pro'}
                </Text>
              </View>
              <Text style={[styles.planName, { color: colors.textSecondary }]}>{status?.plan === 'pro_annual' ? 'Annual' : 'Monthly'}</Text>
            </View>
            {status?.trialEndsAt && (
              <Text style={styles.trialText}>
                Trial ends {new Date(status.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
            {status?.currentPeriodEnd && (
              <Text style={[styles.periodText, { color: colors.textSecondary }]}>
                Next billing: {new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </Card>

          <Pressable style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.surface }, pressed && styles.pressed]} onPress={handleManage}>
            {loading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.manageText}>Manage Subscription</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <FontAwesome name="arrow-left" size={16} color={colors.text} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Go Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Everything you need to stay on top of your sole trader taxes.
          </Text>
        </View>

        {/* Plan Selection */}
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }, selectedPlan === plan.id && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.radioRow}>
                <View style={[styles.radio, selectedPlan === plan.id && styles.radioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.planCardName, { color: colors.text }]}>{plan.name}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>{'\u00A3'}</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={[styles.interval, { color: colors.textSecondary }]}>{plan.interval}</Text>
              </View>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* Features */}
        <Card>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Everything in Pro</Text>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <FontAwesome name={f.icon} size={14} color={Colors.secondary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </Card>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.ctaText}>Start 14-day free trial</Text>
          )}
        </Pressable>

        <Text style={[styles.trialNote, { color: colors.textSecondary }]}>
          No charge until your trial ends. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  header: { marginTop: Spacing.sm },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.primary },
  subtitle: { fontFamily: 'Manrope_400Regular', fontSize: 15, marginTop: Spacing.xs, lineHeight: 22 },

  plans: { flexDirection: 'row', gap: Spacing.sm },
  planCard: { flex: 1, borderRadius: BorderRadius.card, padding: Spacing.md, borderWidth: 2, ...Shadows.soft },
  planCardSelected: { borderColor: Colors.primary },
  badgeContainer: { position: 'absolute', top: -10, right: 12, backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill },
  badgeText: { fontFamily: 'Manrope_700Bold', fontSize: 9, color: Colors.white, letterSpacing: 0.5 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.grey[400], alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  planCardName: { fontFamily: 'Manrope_600SemiBold', fontSize: 15 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm },
  currency: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: Colors.primary },
  price: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, color: Colors.primary },
  interval: { fontFamily: 'Manrope_400Regular', fontSize: 13, marginLeft: 2 },
  planDesc: { fontFamily: 'Manrope_400Regular', fontSize: 12, marginTop: Spacing.xs },

  featuresTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  featureIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success + '12', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: 'Manrope_500Medium', fontSize: 14, flex: 1 },

  ctaButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: BorderRadius.button, alignItems: 'center', ...Shadows.medium },
  ctaText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: Colors.white },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  trialNote: { fontFamily: 'Manrope_400Regular', fontSize: 12, textAlign: 'center' },

  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.pill },
  activeBadgeText: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: Colors.success },
  planName: { fontFamily: 'Manrope_500Medium', fontSize: 14 },
  trialText: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: Colors.accent, marginTop: Spacing.sm },
  periodText: { fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: Spacing.xs },
  manageButton: { paddingVertical: 14, borderRadius: BorderRadius.button, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  manageText: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: Colors.primary },
});

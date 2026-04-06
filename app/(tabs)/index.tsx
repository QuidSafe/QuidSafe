import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useDashboard, useApiToken } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  useApiToken();
  const { user } = useUser();
  const { data, isLoading, refetch, isRefetching } = useDashboard();

  const firstName = user?.firstName ?? data?.user?.name?.split(' ')[0] ?? '';
  const tax = data?.tax;
  const income = data?.income;
  const quarter = data?.quarters?.current?.quarter ?? 1;
  const taxYear = data?.quarters?.current?.taxYear ?? '2026/27';
  const actions = data?.actions;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header} accessible={true} accessibilityRole="header">
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name} accessibilityRole="header">{firstName ? `Hey, ${firstName}` : 'Welcome to QuidSafe'}</Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Hero Tax Card */}
            <Pressable
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Tax summary. Set aside ${formatCurrency(tax?.totalTaxOwed ?? 0)} for tax based on ${formatCurrency(tax?.totalIncome ?? 0)} income this tax year`}
              style={({ pressed }) => [pressed && styles.pressedCard]}
            >
              <LinearGradient
                colors={['#0F172A', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Gold glow accent */}
                <View style={styles.heroGlow} />

                <Text style={styles.heroLabel}>SET ASIDE FOR TAX</Text>
                <Text style={styles.heroAmount}>
                  {formatCurrency(tax?.totalTaxOwed ?? 0)}
                </Text>
                <Text style={styles.heroSubtext}>
                  Based on {formatCurrency(tax?.totalIncome ?? 0)} income this tax year
                </Text>

                {/* 3 glassmorphic boxes */}
                <View style={styles.heroSplit}>
                  <View style={styles.heroSplitBox}>
                    <Text style={styles.splitLabel}>Income Tax</Text>
                    <Text style={styles.splitValue}>
                      {formatCurrency(tax?.incomeTax?.total ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.heroSplitDivider} />
                  <View style={styles.heroSplitBox}>
                    <Text style={styles.splitLabel}>NI (Class 4)</Text>
                    <Text style={styles.splitValue}>
                      {formatCurrency(tax?.nationalInsurance?.total ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.heroSplitDivider} />
                  <View style={styles.heroSplitBox}>
                    <Text style={styles.splitLabel}>Expenses</Text>
                    <Text style={[styles.splitValue, styles.splitExpenses]}>
                      -{formatCurrency(tax?.totalExpenses ?? 0)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Plain English Insight */}
            {tax?.plainEnglish ? (
              <Pressable
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Tax insight: ${tax.plainEnglish}`}
                style={({ pressed }) => [styles.insightBanner, pressed && styles.pressedCard]}
              >
                <View style={styles.insightIcon}>
                  <FontAwesome name="lightbulb-o" size={14} color={Colors.secondary} />
                </View>
                <Text style={styles.insightText}>{tax.plainEnglish}</Text>
              </Pressable>
            ) : null}

            {/* Monthly set-aside */}
            <Pressable
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Set aside ${formatCurrency(tax?.setAsideMonthly ?? 0)} this month. Effective tax rate ${tax?.effectiveRate ? `${tax.effectiveRate}%` : '0%'}`}
              style={({ pressed }) => [styles.setAsideCard, pressed && styles.pressedCard]}
            >
              <View>
                <Text style={styles.setAsideLabel}>SET ASIDE THIS MONTH</Text>
                <Text style={styles.setAsideAmount}>
                  {formatCurrency(tax?.setAsideMonthly ?? 0)}
                </Text>
              </View>
              <View style={styles.setAsideRight}>
                <Text style={styles.setAsideRate}>
                  {tax?.effectiveRate ? `${tax.effectiveRate}%` : '0%'}
                </Text>
                <Text style={styles.setAsideRateLabel}>effective rate</Text>
              </View>
            </Pressable>

            {/* Action Items */}
            <View style={styles.actions} accessibilityRole="list" accessibilityLabel="Action items">
              {actions && actions.length > 0 ? (
                actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    type={(action.type as 'warning' | 'info' | 'action') ?? 'info'}
                    title={action.title}
                    description={action.subtitle}
                  />
                ))
              ) : (
                <>
                  {(income?.total ?? 0) === 0 && (
                    <ActionCard
                      type="action"
                      title="Connect your bank"
                      description="Link your bank account to automatically track income and expenses."
                      icon="university"
                    />
                  )}
                  <ActionCard
                    type="warning"
                    title={`Q${quarter} payment due`}
                    description="Submit your quarterly update to HMRC before the deadline."
                    icon="clock-o"
                  />
                </>
              )}
            </View>

            {/* Quarter Timeline */}
            <Card>
              <QuarterTimeline currentQuarter={quarter} taxYear={taxYear} />
            </Card>

            {/* Income by Source */}
            {income && income.bySource.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>Income by Source</Text>
                {income.bySource.map((src) => (
                  <View key={src.name} style={styles.sourceRow}>
                    <View style={styles.sourceLeft}>
                      <View style={[styles.sourceDot, { backgroundColor: Colors.secondary }]} />
                      <Text style={styles.sourceName}>{src.name}</Text>
                    </View>
                    <View style={styles.sourceRight}>
                      <Text style={styles.sourceAmount}>{formatCurrency(src.amount)}</Text>
                      <View style={styles.sourceBar}>
                        <View style={[styles.sourceBarFill, { width: `${src.percentage}%` }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  greeting: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
    marginTop: 2,
  },

  // Press state for interactive cards
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  // Hero Tax Card
  heroCard: {
    borderRadius: BorderRadius.hero,
    padding: 22,
    overflow: 'hidden',
    ...Shadows.large,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(202, 138, 4, 0.12)',
  },
  heroLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 36,
    color: Colors.white,
    marginTop: 4,
  },
  heroSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: Spacing.xs,
  },
  heroSplit: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  heroSplitBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroSplitDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  splitLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: Colors.white,
    marginTop: 4,
  },
  splitExpenses: {
    color: '#4ADE80',
  },

  // Insight banner
  insightBanner: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  insightText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
    flex: 1,
  },

  // Set Aside card
  setAsideCard: {
    backgroundColor: Colors.gold[50],
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setAsideLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    color: Colors.gold[700],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  setAsideAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    color: Colors.light.text,
    marginTop: 2,
  },
  setAsideRight: {
    alignItems: 'flex-end',
  },
  setAsideRate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: Colors.accent,
  },
  setAsideRateLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: Colors.gold[700],
  },

  // Actions
  actions: {
    gap: 7,
  },

  // Section
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  // Income sources
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.text,
  },
  sourceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sourceAmount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
  },
  sourceBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.grey[200],
    borderRadius: 2,
  },
  sourceBarFill: {
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
});

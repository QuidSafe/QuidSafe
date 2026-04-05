import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { Card } from '@/components/ui/Card';
import { ActionCard } from '@/components/ui/ActionCard';
import { QuarterTimeline } from '@/components/ui/QuarterTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{firstName ? `Hey, ${firstName}` : 'Welcome to QuidSafe'}</Text>
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
            <Card style={styles.heroCard}>
              <Text style={styles.heroLabel}>SET ASIDE FOR TAX</Text>
              <Text style={styles.heroAmount}>
                {formatCurrency(tax?.totalTaxOwed ?? 0)}
              </Text>
              <Text style={styles.heroSubtext}>
                Based on {formatCurrency(tax?.totalIncome ?? 0)} income this tax year
              </Text>

              <View style={styles.heroSplit}>
                <View style={styles.heroSplitBox}>
                  <Text style={styles.splitLabel}>Income Tax</Text>
                  <Text style={styles.splitValue}>
                    {formatCurrency(tax?.incomeTax?.total ?? 0)}
                  </Text>
                </View>
                <View style={styles.heroSplitDivider} />
                <View style={styles.heroSplitBox}>
                  <Text style={styles.splitLabel}>National Insurance</Text>
                  <Text style={styles.splitValue}>
                    {formatCurrency(tax?.nationalInsurance?.total ?? 0)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Plain English Insight */}
            {tax?.plainEnglish ? (
              <View style={styles.insightBanner}>
                <Text style={styles.insightText}>{tax.plainEnglish}</Text>
              </View>
            ) : null}

            {/* Monthly set-aside */}
            <Card>
              <Text style={styles.sectionLabel}>Set Aside Monthly</Text>
              <Text style={styles.sectionAmount}>
                {formatCurrency(tax?.setAsideMonthly ?? 0)}
              </Text>
              <Text style={styles.sectionHint}>
                {tax?.effectiveRate
                  ? `${tax.effectiveRate}% effective tax rate`
                  : 'Connect your bank to start tracking'}
              </Text>
            </Card>

            {/* Action Items */}
            <View style={styles.actions}>
              {(income?.total ?? 0) === 0 && (
                <ActionCard
                  type="action"
                  title="Connect your bank"
                  description="Link your bank account to automatically track income and expenses."
                />
              )}
              <ActionCard
                type="info"
                title={`Q${quarter} in progress`}
                description={`Submit your quarterly update to HMRC by the deadline.`}
              />
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
                    <Text style={styles.sourceName}>{src.name}</Text>
                    <View style={styles.sourceRight}>
                      <Text style={styles.sourceAmount}>{formatCurrency(src.amount)}</Text>
                      <Text style={styles.sourcePercent}>{src.percentage}%</Text>
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

  // Hero Tax Card
  heroCard: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
  },
  heroLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 40,
    color: Colors.white,
    marginTop: 4,
  },
  heroSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: Spacing.xs,
  },
  heroSplit: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.input,
    padding: Spacing.md,
  },
  heroSplitBox: {
    flex: 1,
    alignItems: 'center',
  },
  heroSplitDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  splitLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  splitValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: Colors.white,
    marginTop: 4,
  },

  // Insight banner
  insightBanner: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  insightText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },

  // Section cards
  sectionLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  sectionAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: Colors.secondary,
    marginTop: 4,
  },
  sectionHint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  // Actions
  actions: {
    gap: Spacing.sm,
  },

  // Income sources
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sourceName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  sourceRight: {
    alignItems: 'flex-end',
  },
  sourceAmount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
  },
  sourcePercent: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

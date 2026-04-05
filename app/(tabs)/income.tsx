import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useDashboard, useQuarterlyBreakdown, useApiToken } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

export default function IncomeScreen() {
  useApiToken();
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();
  const { data: quarterly } = useQuarterlyBreakdown();

  const income = dashboard?.income;
  const tax = dashboard?.tax;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Income</Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Summary row */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Gross Income</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(income?.total ?? 0)}</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Net Profit</Text>
                <Text style={[styles.summaryAmount, { color: Colors.secondary }]}>
                  {formatCurrency(tax?.netProfit ?? 0)}
                </Text>
              </Card>
            </View>

            {/* Expenses */}
            <Card>
              <Text style={styles.sectionTitle}>Expenses Claimed</Text>
              <Text style={styles.expenseAmount}>{formatCurrency(tax?.totalExpenses ?? 0)}</Text>
              <Text style={styles.expenseHint}>
                Tax saving: {formatCurrency((tax?.totalExpenses ?? 0) * 0.2)}
              </Text>
            </Card>

            {/* Income by Source */}
            <Card>
              <Text style={styles.sectionTitle}>By Source</Text>
              {income && income.bySource.length > 0 ? (
                income.bySource.map((src) => (
                  <View key={src.name} style={styles.sourceRow}>
                    <View style={styles.sourceLeft}>
                      <Text style={styles.sourceName}>{src.name}</Text>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${src.percentage}%` }]} />
                      </View>
                    </View>
                    <View style={styles.sourceRight}>
                      <Text style={styles.sourceAmount}>{formatCurrency(src.amount)}</Text>
                      <Text style={styles.sourcePercent}>{src.percentage}%</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Connect your bank account to see income broken down by source.
                </Text>
              )}
            </Card>

            {/* Quarterly Breakdown */}
            <Card>
              <Text style={styles.sectionTitle}>Quarterly Breakdown</Text>
              {quarterly?.quarters ? (
                quarterly.quarters.map((q: { quarter: number; income: number; expenses: number; from: string }) => (
                  <View key={q.quarter} style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Q{q.quarter}</Text>
                    <View style={styles.quarterValues}>
                      <Text style={styles.quarterIncome}>{formatCurrency(q.income)}</Text>
                      <Text style={styles.quarterExpense}>-{formatCurrency(q.expenses)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Quarterly data will appear once you have transactions.</Text>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.light.text },

  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryCard: { flex: 1 },
  summaryLabel: { fontFamily: 'Manrope_500Medium', fontSize: 12, color: Colors.light.textSecondary },
  summaryAmount: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, color: Colors.primary, marginTop: 4 },

  sectionTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.light.text, marginBottom: Spacing.md },
  expenseAmount: { fontFamily: 'Manrope_700Bold', fontSize: 24, color: Colors.light.text },
  expenseHint: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 4 },

  sourceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  sourceLeft: { flex: 1, marginRight: Spacing.md },
  sourceName: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: Colors.light.text, marginBottom: 6 },
  barBackground: { height: 6, backgroundColor: Colors.grey[100], borderRadius: 3 },
  barFill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 3 },
  sourceRight: { alignItems: 'flex-end' },
  sourceAmount: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.light.text },
  sourcePercent: { fontFamily: 'Manrope_400Regular', fontSize: 12, color: Colors.light.textSecondary },

  quarterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  quarterLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.primary },
  quarterValues: { alignItems: 'flex-end' },
  quarterIncome: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.secondary },
  quarterExpense: { fontFamily: 'Manrope_400Regular', fontSize: 12, color: Colors.error },

  emptyText: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: Colors.light.textSecondary },
});

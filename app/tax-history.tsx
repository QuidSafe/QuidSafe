import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useQuarterlyBreakdown } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

const TAX_YEARS = ['2025/26', '2024/25', '2023/24'];

function getCurrentTaxYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // UK tax year runs 6 Apr to 5 Apr
  if (month >= 4 && now.getDate() >= 6 || month > 4) {
    return `${year}/${(year + 1).toString().slice(2)}`;
  }
  return `${year - 1}/${year.toString().slice(2)}`;
}

function getPriorTaxYear(taxYear: string): string {
  const startYear = parseInt(taxYear.split('/')[0], 10);
  return `${startYear - 1}/${startYear.toString().slice(2)}`;
}

function formatPercentChange(current: number, prior: number): { value: string; isPositive: boolean } {
  if (prior === 0) return { value: 'N/A', isPositive: true };
  const pct = ((current - prior) / prior) * 100;
  return {
    value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    isPositive: pct >= 0,
  };
}

export default function TaxHistoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const currentTaxYear = getCurrentTaxYear();
  const [selectedYear, setSelectedYear] = useState(currentTaxYear);
  const priorYear = getPriorTaxYear(selectedYear);

  const { data: selectedData, isLoading: selectedLoading, refetch: refetchSelected, isRefetching } = useQuarterlyBreakdown(selectedYear);
  const { data: priorData, isLoading: priorLoading } = useQuarterlyBreakdown(priorYear);

  const isLoading = selectedLoading || priorLoading;

  // Year summary
  const yearTotal = selectedData?.yearTotal;
  const netProfit = (yearTotal?.income ?? 0) - (yearTotal?.expenses ?? 0);
  const effectiveRate = yearTotal?.effectiveRate ?? 0;

  // Prior year summary for comparison
  const priorTotal = priorData?.yearTotal;

  // Income change
  const incomeChange = useMemo(() => {
    if (!yearTotal || !priorTotal) return null;
    return {
      amount: yearTotal.income - priorTotal.income,
      pct: formatPercentChange(yearTotal.income, priorTotal.income),
    };
  }, [yearTotal, priorTotal]);

  const expenseChange = useMemo(() => {
    if (!yearTotal || !priorTotal) return null;
    return {
      amount: yearTotal.expenses - priorTotal.expenses,
      pct: formatPercentChange(yearTotal.expenses, priorTotal.expenses),
    };
  }, [yearTotal, priorTotal]);

  const taxChange = useMemo(() => {
    if (!yearTotal || !priorTotal) return null;
    return {
      amount: yearTotal.totalTaxOwed - priorTotal.totalTaxOwed,
      pct: formatPercentChange(yearTotal.totalTaxOwed, priorTotal.totalTaxOwed),
    };
  }, [yearTotal, priorTotal]);

  // Chart data: income by quarter for selected year vs prior year
  const chartData = useMemo(() => {
    const selectedQs = selectedData?.quarters ?? [];
    const priorQs = priorData?.quarters ?? [];
    const quarters = [1, 2, 3, 4];
    return quarters.map((q) => ({
      quarter: q,
      current: selectedQs.find((sq) => sq.quarter === q)?.income ?? 0,
      prior: priorQs.find((pq) => pq.quarter === q)?.income ?? 0,
    }));
  }, [selectedData, priorData]);

  const chartMax = Math.max(...chartData.map((d) => Math.max(d.current, d.prior)), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetchSelected()}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Back button + Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Tax History</Text>
          <View style={{ width: 18 }} />
        </View>

        {/* Tax Year Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {TAX_YEARS.map((year) => {
            const isActive = year === selectedYear;
            return (
              <Pressable
                key={year}
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                  !isActive && { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setSelectedYear(year)}
               
                accessibilityRole="button"
                accessibilityLabel={`Tax year ${year}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive ? styles.pillTextActive : { color: colors.textSecondary },
                  ]}
                >
                  {year}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <>
            {/* Year Summary Card */}
            <Card variant="glass" style={styles.summaryCard}>
              <Text style={[styles.summaryHeading, { color: colors.text }]}>
                {selectedYear} Summary
              </Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gross Income</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(yearTotal?.income ?? 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(yearTotal?.expenses ?? 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Profit</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    {formatCurrency(netProfit)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Tax Owed</Text>
                  <Text style={[styles.summaryValue, { color: Colors.accent }]}>
                    {formatCurrency(yearTotal?.totalTaxOwed ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={[styles.effectiveRateRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.effectiveRateLabel, { color: colors.textSecondary }]}>
                  Effective Tax Rate
                </Text>
                <Text style={[styles.effectiveRateValue, { color: colors.text }]}>
                  {effectiveRate.toFixed(1)}%
                </Text>
              </View>
            </Card>

            {/* Year-over-Year Comparison */}
            {priorTotal && (
              <Card variant="glass" style={styles.comparisonCard}>
                <Text style={[styles.comparisonHeading, { color: colors.text }]}>
                  vs {priorYear}
                </Text>

                {incomeChange && (
                  <View style={[styles.comparisonRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Income</Text>
                    <View style={styles.comparisonValues}>
                      <Text
                        style={[
                          styles.comparisonAmount,
                          { color: incomeChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {incomeChange.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(incomeChange.amount))}
                      </Text>
                      <Text
                        style={[
                          styles.comparisonPct,
                          { color: incomeChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {incomeChange.pct.value}
                      </Text>
                    </View>
                  </View>
                )}

                {expenseChange && (
                  <View style={[styles.comparisonRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Expenses</Text>
                    <View style={styles.comparisonValues}>
                      <Text
                        style={[
                          styles.comparisonAmount,
                          // Lower expenses = improvement (green)
                          { color: !expenseChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {expenseChange.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(expenseChange.amount))}
                      </Text>
                      <Text
                        style={[
                          styles.comparisonPct,
                          { color: !expenseChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {expenseChange.pct.value}
                      </Text>
                    </View>
                  </View>
                )}

                {taxChange && (
                  <View style={styles.comparisonRowLast}>
                    <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Tax Owed</Text>
                    <View style={styles.comparisonValues}>
                      <Text
                        style={[
                          styles.comparisonAmount,
                          // Lower tax = improvement (green)
                          { color: !taxChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {taxChange.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(taxChange.amount))}
                      </Text>
                      <Text
                        style={[
                          styles.comparisonPct,
                          { color: !taxChange.pct.isPositive ? Colors.success : Colors.error },
                        ]}
                      >
                        {taxChange.pct.value}
                      </Text>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* Quarterly Breakdown */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Quarterly Breakdown</Text>

            {(selectedData?.quarters ?? []).map((q) => {
              const isPast = new Date(q.endDate) < new Date();
              const status = isPast ? 'submitted' : 'pending';
              return (
                <Card key={q.quarter} variant="glass" style={styles.quarterCard}>
                  <View style={styles.quarterHeader}>
                    <Text style={[styles.quarterTitle, { color: colors.text }]}>
                      Q{q.quarter}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        status === 'submitted'
                          ? { backgroundColor: 'rgba(22,163,74,0.1)' }
                          : { backgroundColor: isDark ? 'rgba(202,138,4,0.12)' : Colors.gold[50] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: status === 'submitted' ? Colors.success : Colors.accent },
                        ]}
                      >
                        {status === 'submitted' ? 'Submitted' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.quarterDates}>
                    <Text style={[styles.quarterDateText, { color: colors.textSecondary }]}>
                      {formatDateShort(q.startDate)} - {formatDateShort(q.endDate)}
                    </Text>
                    <Text style={[styles.quarterDateText, { color: colors.textSecondary }]}>
                      Deadline: {formatDateShort(q.deadline)}
                    </Text>
                  </View>
                  <View style={[styles.quarterMetrics, { borderTopColor: colors.border }]}>
                    <View style={styles.quarterMetric}>
                      <Text style={[styles.quarterMetricLabel, { color: colors.textSecondary }]}>Income</Text>
                      <Text style={[styles.quarterMetricValue, { color: colors.text }]}>
                        {formatCurrency(q.income)}
                      </Text>
                    </View>
                    <View style={styles.quarterMetric}>
                      <Text style={[styles.quarterMetricLabel, { color: colors.textSecondary }]}>Expenses</Text>
                      <Text style={[styles.quarterMetricValue, { color: colors.text }]}>
                        {formatCurrency(q.expenses)}
                      </Text>
                    </View>
                    <View style={styles.quarterMetric}>
                      <Text style={[styles.quarterMetricLabel, { color: colors.textSecondary }]}>Tax</Text>
                      <Text style={[styles.quarterMetricValue, { color: Colors.accent }]}>
                        {formatCurrency(q.tax)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}

            {/* Bar Chart: Current vs Prior Year by Quarter */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Income by Quarter
            </Text>

            <Card variant="glass" style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {chartData.map((d) => {
                  const currentHeight = Math.max((d.current / chartMax) * 120, 2);
                  const priorHeight = Math.max((d.prior / chartMax) * 120, 2);
                  return (
                    <View key={d.quarter} style={styles.chartColumn}>
                      <View style={styles.barsWrapper}>
                        <View
                          style={[styles.barCurrent, { height: currentHeight }]}
                        />
                        <View
                          style={[styles.barPrior, { height: priorHeight }]}
                        />
                      </View>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                        Q{d.quarter}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {selectedYear}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.grey[300] }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {priorYear}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.playfair.bold,
    fontSize: 24,
  },

  // Tax Year Pill Selector
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pillText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 13,
  },
  pillTextActive: {
    color: Colors.white,
  },

  // Loading
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },

  // Year Summary Card
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryHeading: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  summaryItem: {
    width: '45%',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: Fonts.manrope.extraBold,
    fontSize: 20,
  },
  effectiveRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  effectiveRateLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  effectiveRateValue: {
    fontFamily: Fonts.manrope.extraBold,
    fontSize: 18,
  },

  // Comparison Card
  comparisonCard: {
    marginBottom: Spacing.lg,
  },
  comparisonHeading: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  comparisonRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  comparisonLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 14,
  },
  comparisonValues: {
    alignItems: 'flex-end',
  },
  comparisonAmount: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 15,
  },
  comparisonPct: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 12,
    marginTop: 2,
  },

  // Section heading
  sectionHeading: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  // Quarter Cards
  quarterCard: {
    marginBottom: Spacing.sm,
  },
  quarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quarterTitle: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontFamily: Fonts.manrope.semiBold,
    fontSize: 11,
  },
  quarterDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  quarterDateText: {
    fontFamily: Fonts.manrope.regular,
    fontSize: 11,
  },
  quarterMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  quarterMetric: {
    flex: 1,
  },
  quarterMetricLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  quarterMetricValue: {
    fontFamily: Fonts.manrope.bold,
    fontSize: 15,
  },

  // Bar Chart
  chartCard: {
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    marginBottom: Spacing.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
  },
  barCurrent: {
    width: 14,
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  barPrior: {
    width: 14,
    backgroundColor: Colors.grey[300],
    borderRadius: 4,
  },
  chartLabel: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 11,
    marginTop: 6,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: Fonts.manrope.medium,
    fontSize: 11,
  },
});

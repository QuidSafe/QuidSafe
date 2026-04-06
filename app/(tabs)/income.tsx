import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useDashboard, useQuarterlyBreakdown } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

type FilterKey = 'all' | 'income' | 'expenses' | 'this_month';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'this_month', label: 'This month' },
];

const SOURCE_ICONS: Record<string, { icon: React.ComponentProps<typeof FontAwesome>['name']; bg: string }> = {
  'Uber / Deliveroo': { icon: 'car', bg: '#DBEAFE' },
  'Cleaning clients': { icon: 'paint-brush', bg: '#D1FAE5' },
  'Freelance dev': { icon: 'laptop', bg: '#FEF3C7' },
  'Consulting': { icon: 'briefcase', bg: '#F3E8FF' },
};

const DEFAULT_ICON: { icon: React.ComponentProps<typeof FontAwesome>['name']; bg: string } = { icon: 'gbp', bg: Colors.grey[100] };

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function IncomeScreen() {
  const { colors } = useTheme();
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();
  const { data: _quarterly } = useQuarterlyBreakdown();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const income = dashboard?.income;
  const tax = dashboard?.tax;

  const grossIncome = income?.total ?? 0;
  const totalExpenses = tax?.totalExpenses ?? 0;
  const netProfit = tax?.netProfit ?? 0;

  // Compute YoY placeholder (static +12% as in mockup since API has no prior year)
  const yoyPercent = 12;

  // Monthly data for chart (placeholder until API provides monthly breakdown)
  const months: { month: string; income: number; expenses: number }[] = (income as any)?.byMonth ?? [
    { month: 'Jan', income: 2400, expenses: 800 },
    { month: 'Feb', income: 3100, expenses: 950 },
    { month: 'Mar', income: 2800, expenses: 700 },
    { month: 'Apr', income: 3600, expenses: 1100 },
    { month: 'May', income: 3200, expenses: 900 },
    { month: 'Jun', income: 4100, expenses: 1200 },
  ];
  const maxMonthValue = Math.max(...months.map((m: { income: number; expenses: number }) => Math.max(m.income, m.expenses)), 1);

  // Source list with search and filter
  const sources = income?.bySource ?? [];
  const sourceCount = sources.length;

  const filteredSources = sources.filter((src) => {
    if (search) {
      const q = search.toLowerCase();
      if (!src.name.toLowerCase().includes(q)) return false;
    }
    // "income" filter: show all since bySource is income; "expenses" filter: hide all
    if (activeFilter === 'expenses') return false;
    return true;
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Heading */}
        <Text style={[styles.title, { color: colors.text }]}>Income</Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <View style={{ height: Spacing.md }} />
            <SkeletonCard />
            <View style={{ height: Spacing.md }} />
            <Skeleton width="40%" height={16} />
            <View style={{ height: Spacing.sm }} />
            <Skeleton width="100%" height={44} />
            <View style={{ height: Spacing.sm }} />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Top summary card */}
            <Card style={styles.topCard}>
              {/* Summary row */}
              <View style={styles.summaryRow}>
                {/* Gross income */}
                <View style={styles.summaryLeft}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gross income</Text>
                  <Text style={[styles.grossAmount, { color: colors.text }]}>{formatCurrency(grossIncome)}</Text>
                  <View style={styles.yoyRow}>
                    <FontAwesome name="arrow-up" size={10} color={Colors.success} />
                    <Text style={styles.yoyText}>+{yoyPercent}% vs last year</Text>
                  </View>
                </View>

                {/* Net profit */}
                <View style={styles.summaryRight}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net profit</Text>
                  <Text style={styles.netAmount}>{formatCurrency(netProfit)}</Text>
                  <Text style={[styles.afterExpenses, { color: colors.textSecondary }]}>
                    After {formatCurrency(totalExpenses)} expenses
                  </Text>
                </View>
              </View>

              {/* Monthly bar chart */}
              <View style={styles.chartContainer}>
                {months.map((m, i) => {
                  const incomeHeight = Math.max((m.income / maxMonthValue) * 100, 2);
                  const expenseHeight = Math.max((m.expenses / maxMonthValue) * 100, 2);
                  const label = MONTH_LABELS[i] ?? m.month.slice(0, 3);
                  return (
                    <View key={m.month} style={styles.chartColumn}>
                      <View style={styles.barsWrapper}>
                        <View
                          style={[
                            styles.barIncome,
                            { height: incomeHeight },
                          ]}
                        />
                        <View
                          style={[
                            styles.barExpense,
                            { height: expenseHeight },
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.grey[300] }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
                </View>
              </View>
            </Card>

            {/* Sources section header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sources</Text>
              <View style={styles.sourceBadge}>
                <Text style={[styles.sourceBadgeText, { color: colors.textSecondary }]}>
                  {sourceCount} source{sourceCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Search input */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FontAwesome
                name="search"
                size={14}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search sources..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {FILTERS.map((f) => {
                const isActive = f.key === activeFilter;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setActiveFilter(f.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Source list card */}
            <Card style={styles.sourceCard}>
              {filteredSources.length > 0 ? (
                filteredSources.map((src, idx) => {
                  const iconInfo =
                    SOURCE_ICONS[src.name] ?? DEFAULT_ICON;
                  const isLast = idx === filteredSources.length - 1;
                  return (
                    <View
                      key={src.name}
                      style={[
                        styles.sourceRow,
                        !isLast && [styles.sourceRowBorder, { borderBottomColor: colors.border }],
                      ]}
                    >
                      {/* Icon badge */}
                      <View
                        style={[
                          styles.sourceIcon,
                          { backgroundColor: iconInfo.bg },
                        ]}
                      >
                        <FontAwesome
                          name={iconInfo.icon}
                          size={16}
                          color={Colors.primary}
                        />
                      </View>

                      {/* Name + subtitle */}
                      <View style={styles.sourceInfo}>
                        <Text style={[styles.sourceName, { color: colors.text }]}>{src.name}</Text>
                        <Text style={[styles.sourceSubtitle, { color: colors.textSecondary }]}>
                          {getSourceSubtitle(src.name)}
                        </Text>
                      </View>

                      {/* Amount + percentage */}
                      <View style={styles.sourceAmounts}>
                        <Text style={[styles.sourceAmount, { color: colors.text }]}>
                          {formatCurrency(src.amount)}
                        </Text>
                        <Text style={[styles.sourcePercent, { color: colors.textSecondary }]}>{src.percentage}%</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {search
                    ? 'No sources match your search.'
                    : 'Connect your bank account to see income broken down by source.'}
                </Text>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getSourceSubtitle(name: string): string {
  const map: Record<string, string> = {
    'Uber / Deliveroo': 'Gig delivery',
    'Cleaning clients': 'Direct invoices',
    'Freelance dev': 'Contract work',
    'Consulting': 'Advisory services',
  };
  return map[name] ?? 'Other income';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Heading
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 19,
    marginBottom: Spacing.md,
  },

  // Top card
  topCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  grossAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    marginBottom: 4,
  },
  yoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yoyText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.success,
  },
  netAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: Colors.success,
    marginBottom: 4,
  },
  afterExpenses: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: Spacing.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
  },
  barIncome: {
    width: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  barExpense: {
    width: 8,
    backgroundColor: Colors.grey[300],
    borderRadius: 4,
  },
  chartLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 9,
    marginTop: 4,
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
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  sourceBadge: {
    backgroundColor: Colors.grey[100],
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  sourceBadgeText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    padding: 0,
  },

  // Filter pills
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.grey[100],
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.grey[600],
  },
  filterPillTextActive: {
    color: Colors.white,
  },

  // Source list card
  sourceCard: {
    paddingVertical: Spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.xs,
  },
  sourceRowBorder: {
    borderBottomWidth: 1,
  },
  sourceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  sourceSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },
  sourceAmounts: {
    alignItems: 'flex-end',
  },
  sourceAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    marginBottom: 2,
  },
  sourcePercent: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },

  // Empty state
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

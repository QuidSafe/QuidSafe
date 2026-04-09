import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUp, ArrowDown, Search, FileText, ChevronRight, Plus, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { IncomeSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateInvoiceModal } from '@/components/ui/CreateInvoiceModal';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { Car, Paintbrush, Laptop, Briefcase, PoundSterling } from 'lucide-react-native';
import { useDashboard, useQuarterlyBreakdown } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

type FilterKey = 'all' | 'income' | 'expenses' | 'this_month';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'this_month', label: 'This month' },
];

const SOURCE_ICONS: Record<string, { IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; bg: string; dot: string }> = {
  'Uber / Deliveroo': { IconComponent: Car, bg: 'rgba(0,102,255,0.12)', dot: '#0066FF' },
  'Cleaning clients': { IconComponent: Paintbrush, bg: 'rgba(0,200,83,0.12)', dot: '#00C853' },
  'Freelance dev': { IconComponent: Laptop, bg: 'rgba(0,102,255,0.12)', dot: '#0066FF' },
  'Consulting': { IconComponent: Briefcase, bg: 'rgba(0,102,255,0.12)', dot: '#0066FF' },
};

const DEFAULT_ICON: { IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; bg: string; dot: string } = { IconComponent: PoundSterling, bg: '#2A2A2A', dot: '#666666' };

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCurrentMonthLabel(): string {
  return MONTH_LABELS[new Date().getMonth()];
}

/** Compute YoY growth from byMonth data if we have at least 12 months */
function computeYoYGrowth(byMonth: { month: string; income: number }[]): number | null {
  if (byMonth.length < 12) return null;
  const recent6 = byMonth.slice(-6);
  const prior6 = byMonth.slice(-12, -6);
  const recentTotal = recent6.reduce((s, m) => s + m.income, 0);
  const priorTotal = prior6.reduce((s, m) => s + m.income, 0);
  if (priorTotal === 0) return null;
  return Math.round(((recentTotal - priorTotal) / priorTotal) * 100);
}

/** Get last N months of data, padding with empty bars if needed */
function getLastNMonths(byMonth: { month: string; income: number; expenses: number }[], n: number) {
  if (byMonth.length >= n) {
    return byMonth.slice(-n);
  }
  // Pad from the left with empty entries
  const now = new Date();
  const result: { month: string; income: number; expenses: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTH_LABELS[d.getMonth()];
    const existing = byMonth.find((m) => m.month === label);
    result.push(existing ?? { month: label, income: 0, expenses: 0 });
  }
  return result;
}

export default function IncomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();
  useQuarterlyBreakdown();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);

  const income = dashboard?.income;
  const tax = dashboard?.tax;

  const grossIncome = income?.total ?? 0;
  const totalExpenses = tax?.totalExpenses ?? 0;
  const netProfit = tax?.netProfit ?? 0;

  // Monthly data for chart - use real byMonth data, fall back to empty bars
  const rawByMonth = useMemo<{ month: string; income: number; expenses: number }[]>(
    () => income?.byMonth ?? [],
    [income?.byMonth]
  );
  const months = useMemo(() => getLastNMonths(rawByMonth, 6), [rawByMonth]);
  const maxMonthValue = useMemo(() => Math.max(...months.map((m) => Math.max(m.income, m.expenses)), 1), [months]);

  // YoY growth - computed from real data, hidden if insufficient
  const yoyPercent = useMemo(() => computeYoYGrowth(rawByMonth), [rawByMonth]);

  // Source list with search and filter
  const sources = income?.bySource ?? [];
  const sourceCount = sources.length;
  const currentMonthLabel = getCurrentMonthLabel();

  const filteredSources = useMemo(() => sources.filter((src) => {
    if (search) {
      const q = search.toLowerCase();
      if (!src.name.toLowerCase().includes(q)) return false;
    }
    // "expenses" filter: hide all since bySource is income
    if (activeFilter === 'expenses') return false;
    // "this_month" filter: check if there's income for this source in the current month
    if (activeFilter === 'this_month') {
      // We check whether any byMonth entry for the current month has income > 0.
      // Since bySource doesn't have per-month breakdown, we filter by checking
      // if the current month in byMonth has any income at all. If the current month
      // has zero income, no sources should show. Otherwise show all sources.
      const currentMonthData = rawByMonth.find((m) => m.month === currentMonthLabel);
      if (!currentMonthData || currentMonthData.income <= 0) return false;
      // Source-level filtering: sources with amount > 0 are shown
      return src.amount > 0;
    }
    return true;
  }), [sources, search, activeFilter, rawByMonth, currentMonthLabel]);

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
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Income</Text>

        {isLoading ? (
          <IncomeSkeleton />
        ) : grossIncome === 0 && sources.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No income recorded yet"
            subtitle="Connect your bank account or create your first invoice to start tracking income."
            actionLabel="Create Invoice"
            onAction={() => setInvoiceModalVisible(true)}
          />
        ) : (
          <>
            {/* Top summary card */}
            <Card style={styles.topCard} accessibilityLabel={`Gross income: ${formatCurrency(grossIncome)}. Net profit: ${formatCurrency(netProfit)}`}>
              {/* Summary row */}
              <View style={styles.summaryRow}>
                {/* Gross income */}
                <View style={styles.summaryLeft} accessibilityLabel={`Gross income: ${formatCurrency(grossIncome)}`}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gross income</Text>
                  <Text style={[styles.grossAmount, { color: colors.text }]}>{formatCurrency(grossIncome)}</Text>
                  {yoyPercent !== null && (
                    <View style={styles.yoyRow}>
                      {yoyPercent >= 0 ? (
                        <ArrowUp size={10} color="#00C853" strokeWidth={1.5} />
                      ) : (
                        <ArrowDown size={10} color="#FF3B30" strokeWidth={1.5} />
                      )}
                      <Text style={[styles.yoyText, { color: yoyPercent >= 0 ? '#00C853' : '#FF3B30' }]}>
                        {yoyPercent >= 0 ? '+' : ''}{yoyPercent}% vs last year
                      </Text>
                    </View>
                  )}
                </View>

                {/* Net profit */}
                <View style={styles.summaryRight} accessibilityLabel={`Net profit: ${formatCurrency(netProfit)}, after ${formatCurrency(totalExpenses)} expenses`}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net profit</Text>
                  <Text style={styles.netAmount}>{formatCurrency(netProfit)}</Text>
                  <Text style={[styles.afterExpenses, { color: colors.textSecondary }]}>
                    After {formatCurrency(totalExpenses)} expenses
                  </Text>
                </View>
              </View>

              {/* Monthly bar chart */}
              <View style={styles.chartContainer}>
                {months.map((m) => {
                  const incomeHeight = Math.max((m.income / maxMonthValue) * 100, 2);
                  const expenseHeight = Math.max((m.expenses / maxMonthValue) * 100, 2);
                  const label = m.month.slice(0, 3);
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
                  <View style={[styles.legendDot, { backgroundColor: '#0066FF' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2A2A2A' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
                </View>
              </View>
            </Card>

            {/* Sources section header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Sources</Text>
              <View style={styles.sourceBadge}>
                <Text style={[styles.sourceBadgeText, { color: colors.textSecondary }]}>
                  {sourceCount} source{sourceCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Search input */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search
                size={14}
                color={colors.textSecondary}
                strokeWidth={1.5}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search sources..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Search income sources"
                accessibilityHint="Type to filter income sources by name"
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
                  <Pressable
                    key={f.key}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setActiveFilter(f.key)}
                   
                    accessibilityRole="button"
                    accessibilityLabel={`Filter: ${f.label}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
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
                      accessibilityLabel={`${src.name}: ${formatCurrency(src.amount)}, ${src.percentage}% of income`}
                    >
                      {/* Colored dot indicator */}
                      <View style={[styles.sourceDot, { backgroundColor: iconInfo.dot }]} />

                      {/* Icon badge */}
                      <View
                        style={[
                          styles.sourceIcon,
                          { backgroundColor: iconInfo.bg },
                        ]}
                      >
                        <iconInfo.IconComponent
                          size={16}
                          color="#0066FF"
                          strokeWidth={1.5}
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
                    : activeFilter === 'this_month'
                    ? 'No income recorded this month yet.'
                    : 'Connect your bank account to see income broken down by source.'}
                </Text>
              )}
            </Card>

            {/* View All Invoices button */}
            <Pressable
              style={[styles.viewInvoicesButton, { borderColor: colors.border }]}
              onPress={() => router.push('/invoices')}
             
              accessibilityRole="button"
              accessibilityLabel="View all invoices"
              accessibilityHint="Tap to see your complete invoice list"
            >
              <FileText size={16} color="#0066FF" strokeWidth={1.5} style={{ marginRight: 10 }} />
              <Text style={[styles.viewInvoicesText, { color: colors.text }]}>View All Invoices</Text>
              <ChevronRight size={12} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button - Create Invoice */}
      {!isLoading && (
        <Pressable
          style={[styles.fab, Shadows.medium]}
          onPress={() => setInvoiceModalVisible(true)}
         
          accessibilityRole="button"
          accessibilityLabel="Create new invoice"
          accessibilityHint="Tap to open the create invoice form"
        >
          <Plus size={20} color={Colors.white} strokeWidth={1.5} />
        </Pressable>
      )}

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        visible={invoiceModalVisible}
        onClose={() => setInvoiceModalVisible(false)}
        onSuccess={() => setInvoiceModalVisible(false)}
      />
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
    paddingBottom: Spacing.xxl + Spacing.lg,
  },

  // Heading
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  grossAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 30,
    marginBottom: 4,
  },
  yoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yoyText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },
  netAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 24,
    color: '#00C853',
    marginBottom: 4,
  },
  afterExpenses: {
    fontFamily: Fonts.sourceSans.regular,
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
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  barExpense: {
    width: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  chartLabel: {
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
  },
  sourceBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  sourceBadgeText: {
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.regular,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    color: '#666666',
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
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  sourceSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
  },
  sourceAmounts: {
    alignItems: 'flex-end',
  },
  sourceAmount: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  sourcePercent: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
  },

  // Empty state
  emptyText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },

  // View Invoices button
  viewInvoicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  viewInvoicesText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    flex: 1,
  },
});

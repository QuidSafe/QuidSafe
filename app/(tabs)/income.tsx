import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useDashboard, useQuarterlyBreakdown, useCreateInvoice } from '@/lib/hooks/useApi';
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
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();
  const { data: _quarterly } = useQuarterlyBreakdown();
  const createInvoiceMutation = useCreateInvoice();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);

  // Invoice form state
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  const income = dashboard?.income;
  const tax = dashboard?.tax;

  const grossIncome = income?.total ?? 0;
  const totalExpenses = tax?.totalExpenses ?? 0;
  const netProfit = tax?.netProfit ?? 0;

  // Monthly data for chart — use real byMonth data, fall back to empty bars
  const rawByMonth = useMemo<{ month: string; income: number; expenses: number }[]>(
    () => income?.byMonth ?? [],
    [income?.byMonth]
  );
  const months = useMemo(() => getLastNMonths(rawByMonth, 6), [rawByMonth]);
  const maxMonthValue = Math.max(...months.map((m) => Math.max(m.income, m.expenses)), 1);

  // YoY growth — computed from real data, hidden if insufficient
  const yoyPercent = useMemo(() => computeYoYGrowth(rawByMonth), [rawByMonth]);

  // Source list with search and filter
  const sources = income?.bySource ?? [];
  const sourceCount = sources.length;
  const currentMonthLabel = getCurrentMonthLabel();

  const filteredSources = sources.filter((src) => {
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
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const resetInvoiceForm = useCallback(() => {
    setInvoiceClientName('');
    setInvoiceAmount('');
    setInvoiceDescription('');
    setInvoiceDueDate('');
  }, []);

  const handleCreateInvoice = useCallback(() => {
    const amount = parseFloat(invoiceAmount);
    if (!invoiceClientName.trim() || isNaN(amount) || amount <= 0 || !invoiceDescription.trim() || !invoiceDueDate.trim()) {
      return;
    }
    createInvoiceMutation.mutate(
      {
        clientName: invoiceClientName.trim(),
        amount,
        description: invoiceDescription.trim(),
        dueDate: invoiceDueDate.trim(),
      },
      {
        onSuccess: () => {
          resetInvoiceForm();
          setInvoiceModalVisible(false);
        },
      }
    );
  }, [invoiceClientName, invoiceAmount, invoiceDescription, invoiceDueDate, createInvoiceMutation, resetInvoiceForm]);

  const isFormValid =
    invoiceClientName.trim().length > 0 &&
    !isNaN(parseFloat(invoiceAmount)) &&
    parseFloat(invoiceAmount) > 0 &&
    invoiceDescription.trim().length > 0 &&
    invoiceDueDate.trim().length > 0;

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
                  {yoyPercent !== null && (
                    <View style={styles.yoyRow}>
                      <FontAwesome
                        name={yoyPercent >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={10}
                        color={yoyPercent >= 0 ? Colors.success : Colors.error}
                      />
                      <Text style={[styles.yoyText, { color: yoyPercent >= 0 ? Colors.success : Colors.error }]}>
                        {yoyPercent >= 0 ? '+' : ''}{yoyPercent}% vs last year
                      </Text>
                    </View>
                  )}
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
                    : activeFilter === 'this_month'
                    ? 'No income recorded this month yet.'
                    : 'Connect your bank account to see income broken down by source.'}
                </Text>
              )}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Floating Action Button — Create Invoice */}
      {!isLoading && (
        <TouchableOpacity
          style={[styles.fab, Shadows.medium]}
          onPress={() => setInvoiceModalVisible(true)}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Create Invoice Modal */}
      <Modal
        visible={invoiceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInvoiceModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Invoice</Text>
              <TouchableOpacity
                onPress={() => {
                  resetInvoiceForm();
                  setInvoiceModalVisible(false);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <FontAwesome name="times" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Client Name */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Client name</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="e.g. Acme Ltd"
              placeholderTextColor={colors.textSecondary}
              value={invoiceClientName}
              onChangeText={setInvoiceClientName}
            />

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
            />

            {/* Description */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="What is this invoice for?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={invoiceDescription}
              onChangeText={setInvoiceDescription}
            />

            {/* Due Date */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Due date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="2026-05-01"
              placeholderTextColor={colors.textSecondary}
              value={invoiceDueDate}
              onChangeText={setInvoiceDueDate}
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || createInvoiceMutation.isPending) && styles.submitButtonDisabled,
              ]}
              onPress={handleCreateInvoice}
              disabled={!isFormValid || createInvoiceMutation.isPending}
              activeOpacity={0.8}
            >
              {createInvoiceMutation.isPending ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Invoice</Text>
              )}
            </TouchableOpacity>

            {createInvoiceMutation.isError && (
              <Text style={styles.errorText}>
                Failed to create invoice. Please try again.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.hero,
    borderTopRightRadius: BorderRadius.hero,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  fieldLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  modalInput: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.xs,
  },
  modalInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
  errorText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Camera, Info, RefreshCw, MapPin, Lightbulb, Receipt, Trash2, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ExpensesSkeleton } from '@/components/ui/Skeleton';
import { DonutChart, CATEGORY_COLORS } from '@/components/ui/DonutChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchFilter } from '@/components/ui/SearchFilter';
import ExpenseRow, { HMRC_CATEGORY_LABELS, getCategoryMeta, formatDate, expenseRowStyles } from '@/components/ui/ExpenseRow';
import AddExpenseModal from '@/components/ui/AddExpenseModal';
import AddRecurringExpenseModal, { FREQUENCY_LABELS, FREQUENCY_COLORS } from '@/components/ui/AddRecurringExpenseModal';
import ExpenseMetrics from '@/components/ui/ExpenseMetrics';
import { TabHeader } from '@/components/ui/TabHeader';
import { colors, Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useExpenses, useDeleteExpense, useDashboard, useRecurringExpenses, useDeleteRecurringExpense } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { hapticMedium } from '@/lib/haptics';

export default function ExpensesScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const { data: dashboardData } = useDashboard();
  const deleteExpense = useDeleteExpense();
  const [showForm, setShowForm] = useState(false);
  const [openedFromReceipt, setOpenedFromReceipt] = useState(false);

  // Recurring expenses state
  const { data: recurringData } = useRecurringExpenses();
  const deleteRecurringExpense = useDeleteRecurringExpense();
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  // Search & date range filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setDateRange({ from, to });
  }, []);

  const expenses = (data?.expenses ?? []) as {
    id: string;
    amount: number;
    description: string;
    date: string;
    hmrc_category?: string;
  }[];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!exp.description.toLowerCase().includes(q)) return false;
      }
      if (dateRange.from) {
        if (exp.date < dateRange.from) return false;
      }
      if (dateRange.to) {
        if (exp.date > dateRange.to) return false;
      }
      return true;
    });
  }, [expenses, searchQuery, dateRange]);

  const totalClaimed = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const effectiveRate = dashboardData?.tax?.effectiveRate ?? 0.2;
  const taxSaved = useMemo(() => totalClaimed * effectiveRate, [totalClaimed, effectiveRate]);

  const categorySegments = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.hmrc_category || 'other';
      grouped[cat] = (grouped[cat] ?? 0) + exp.amount;
    }
    return Object.entries(grouped).map(([label, value]) => ({
      label: HMRC_CATEGORY_LABELS[label] || label,
      value,
      color: CATEGORY_COLORS[label] || CATEGORY_COLORS['other'] || '#6B7280',
    }));
  }, [expenses]);

  const recurringExpenses = useMemo(() => (recurringData?.recurringExpenses ?? []).map((r) => {
    const raw = r as unknown as Record<string, unknown>;
    return {
      id: r.id,
      amount: r.amount,
      description: r.description,
      hmrc_category: r.hmrcCategory ?? (raw['hmrc_category'] as string | undefined),
      frequency: r.frequency,
      next_due_date: r.nextDueDate ?? (raw['next_due_date'] as string),
    };
  }), [recurringData?.recurringExpenses]);

  const handleDelete = (id: string, desc: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete expense "${desc}"?`)) {
        deleteExpense.mutate(id);
        hapticMedium();
      }
    } else {
      Alert.alert(
        'Delete expense',
        `Are you sure you want to delete "${desc}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => { deleteExpense.mutate(id); hapticMedium(); },
          },
        ],
      );
    }
  };

  const handleDeleteRecurring = (id: string, desc: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Cancel recurring expense "${desc}"?`)) {
        deleteRecurringExpense.mutate(id);
      }
    } else {
      Alert.alert(
        'Cancel recurring expense',
        `Are you sure you want to cancel "${desc}"?`,
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => deleteRecurringExpense.mutate(id),
          },
        ],
      );
    }
  };

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
      >
        {/* Header */}
        <TabHeader
          title="Expenses"
          rightAction={
            <Pressable
              style={({ pressed }) => [styles.fabButton, pressed && styles.pressed]}
              onPress={() => setShowForm(true)}
              accessibilityRole="button"
              accessibilityLabel="Add new expense"
              accessibilityHint="Tap to open the add expense form"
            >
              <Plus size={16} color={Colors.white} strokeWidth={1.5} />
            </Pressable>
          }
        />

        {/* Metric Cards */}
        <ExpenseMetrics
          totalClaimed={totalClaimed}
          taxSaved={taxSaved}
          thisMonthTotal={thisMonthTotal}
        />

        {/* Spending by Category */}
        {categorySegments.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Spending by Category</Text>
            </View>
            <Card variant="elevated" style={styles.categoryChartCard}>
              <DonutChart
                segments={categorySegments}
                centerLabel="Total expenses"
                centerValue={formatCurrency(totalClaimed)}
              />
            </Card>
          </>
        )}

        {/* Scan Receipt Button */}
        <Pressable
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
          onPress={() => { setOpenedFromReceipt(true); setShowForm(true); }}
          accessibilityRole="button"
          accessibilityLabel="Add expense from receipt"
          accessibilityHint="Tap to add a new expense"
        >
          <Camera size={16} color={Colors.white} strokeWidth={1.5} />
          <Text style={styles.scanButtonText}>Add expense from receipt</Text>
        </Pressable>

        {/* What Can I Claim Button */}
        <Pressable
          style={({ pressed }) => [styles.outlineButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/learn')}
          accessibilityRole="link"
          accessibilityLabel="What can I claim? See the full list"
          accessibilityHint="Opens the Learn page with claimable expenses"
        >
          <Info size={16} color="#0066FF" strokeWidth={1.5} />
          <Text style={styles.outlineButtonText}>What can I claim? See the full list</Text>
        </Pressable>

        {/* Search & Date Filter */}
        {!isLoading && expenses.length > 0 && (
          <SearchFilter
            searchPlaceholder="Search expenses..."
            onSearchChange={handleSearchChange}
            onDateRangeChange={handleDateRangeChange}
            showDateFilter
          />
        )}

        {/* Claimed Expenses Section */}
        {isLoading ? (
          <ExpensesSkeleton />
        ) : expenses.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Claimed expenses</Text>
              <View style={styles.itemsBadge}>
                <Text style={styles.itemsBadgeText}>{filteredExpenses.length} items</Text>
              </View>
            </View>

            <Card style={styles.listCard}>
              {filteredExpenses.map((item, index) => (
                <ExpenseRow
                  key={item.id}
                  item={item}
                  index={index}
                  totalCount={filteredExpenses.length}
                  onPress={(id) => router.push(`/expense/${id}`)}
                  onDelete={handleDelete}
                  colors={colors}
                />
              ))}
            </Card>
          </>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            subtitle="Start logging your business expenses to reduce your tax bill."
            actionLabel="Add Expense"
            onAction={() => setShowForm(true)}
            tintColor={Colors.success}
          />
        )}

        {/* Recurring Expenses Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">Recurring expenses</Text>
          {recurringExpenses.length > 0 && (
            <View style={styles.itemsBadge}>
              <Text style={styles.itemsBadgeText}>{recurringExpenses.length} active</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Pressable
            style={({ pressed }) => [styles.addRecurringButton, pressed && styles.pressed]}
            onPress={() => setShowRecurringForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Add recurring expense"
          >
            <Plus size={12} color={Colors.white} strokeWidth={1.5} />
            <Text style={styles.addRecurringText}>Add Recurring</Text>
          </Pressable>
        </View>

        {recurringExpenses.length > 0 ? (
          <Card style={styles.listCard}>
            {recurringExpenses.map((rec, index) => {
              const meta = getCategoryMeta(rec.hmrc_category);
              const freqColor = FREQUENCY_COLORS[rec.frequency] ?? FREQUENCY_COLORS.monthly;
              return (
                <View
                  key={rec.id}
                  style={[
                    expenseRowStyles.expenseRow,
                    index < recurringExpenses.length - 1 && [expenseRowStyles.expenseRowBorder, { borderBottomColor: colors.border }],
                  ]}
                >
                  <View style={[expenseRowStyles.iconBadge, { backgroundColor: meta.bg }]}>
                    <RefreshCw size={16} color={meta.color} strokeWidth={1.5} />
                  </View>
                  <View style={expenseRowStyles.expenseMiddle}>
                    <Text style={[expenseRowStyles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                      {rec.description}
                    </Text>
                    <View style={expenseRowStyles.expenseSubRow}>
                      <View style={[expenseRowStyles.hmrcBadge, { backgroundColor: freqColor.bg }]}>
                        <Text style={[expenseRowStyles.hmrcBadgeText, { color: freqColor.color }]}>
                          {FREQUENCY_LABELS[rec.frequency] ?? rec.frequency}
                        </Text>
                      </View>
                      <Text style={[expenseRowStyles.expenseSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        Next: {formatDate(rec.next_due_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={expenseRowStyles.expenseRight}>
                    <Text style={[expenseRowStyles.expenseAmount, { color: colors.text }]}>{formatCurrency(rec.amount)}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [expenseRowStyles.deleteButton, pressed && styles.pressed]}
                    onPress={() => handleDeleteRecurring(rec.id, rec.description)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Cancel recurring expense: ${rec.description}`}
                  >
                    <Trash2 size={16} color="#FF3B30" strokeWidth={1.5} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        ) : (
          <Card variant="elevated" style={styles.recurringEmpty}>
            <RefreshCw size={20} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.recurringEmptyTitle, { color: colors.text }]}>No recurring expenses</Text>
            <Text style={[styles.recurringEmptyText, { color: colors.textSecondary }]}>
              Add monthly subscriptions, rent, or phone bills to auto-log them.
            </Text>
          </Card>
        )}

        {/* Gold Insight Banner */}
        <View style={styles.insightBanner} accessibilityLabel="Tip: Do you use your car for work? Track your mileage to claim up to 45p per mile in tax relief.">
          <Lightbulb size={18} color="#0066FF" strokeWidth={1.5} style={styles.insightIcon} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Tip: </Text>
            Do you use your car for work? Track your mileage to claim up to 45p per mile in tax relief.
          </Text>
        </View>

        {/* Mileage Tracking */}
        <Pressable
          style={[styles.comingSoonCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/mileage' as any)}
          accessibilityRole="button"
          accessibilityLabel="Track your business mileage"
        >
          <View style={styles.comingSoonContent}>
            <MapPin size={20} color={Colors.secondary} strokeWidth={1.5} />
            <View style={styles.comingSoonText}>
              <Text style={[styles.comingSoonTitle, { color: colors.text }]}>Mileage tracking</Text>
              <Text style={[styles.comingSoonSub, { color: colors.textSecondary }]}>Log business miles - HMRC rates applied</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </View>
        </Pressable>
      </ScrollView>

      <AddExpenseModal
        visible={showForm}
        openedFromReceipt={openedFromReceipt}
        onClose={() => { setOpenedFromReceipt(false); setShowForm(false); }}
        onSuccess={() => { setOpenedFromReceipt(false); setShowForm(false); }}
      />

      <AddRecurringExpenseModal
        visible={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
        onSuccess={() => setShowRecurringForm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },

  /* Header */
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },

  /* Scan Receipt Button */
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    ...Shadows.medium,
  },
  scanButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },

  /* Outline Button */
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    ...Shadows.soft,
  },
  outlineButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.secondary,
  },

  /* Section Header - matches dashboard + income */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.md + 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  itemsBadge: {
    backgroundColor: 'rgba(0,200,83,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  itemsBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.success,
  },

  /* Expense List */
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },

  /* Gold Insight Banner */
  insightBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,102,255,0.08)',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  insightIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.accent,
  },
  insightBold: {
    fontFamily: Fonts.lexend.bold,
  },

  /* Coming Soon Card */
  comingSoonCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.midGrey,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
  },
  comingSoonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comingSoonText: {
    flex: 1,
    marginLeft: 12,
  },
  comingSoonTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoonSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  soonBadge: {
    backgroundColor: Colors.blueGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  soonBadgeText: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: Colors.secondary,
  },

  /* Add Recurring Button */
  addRecurringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  addRecurringText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
  },

  /* Recurring Empty State */
  recurringEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  recurringEmptyTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },
  recurringEmptyText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },

  categoryChartCard: {
    padding: Spacing.md,
  },
});

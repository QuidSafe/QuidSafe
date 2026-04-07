import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { ExpensesSkeleton } from '@/components/ui/Skeleton';
import { DonutChart, CATEGORY_COLORS } from '@/components/ui/DonutChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useExpenses, useAddExpense, useDeleteExpense, useDashboard, useRecurringExpenses, useCreateRecurringExpense, useDeleteRecurringExpense } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';
import { hapticSuccess, hapticMedium } from '@/lib/haptics';

const CATEGORY_ICONS: Record<string, { icon: React.ComponentProps<typeof FontAwesome>['name']; bg: string; color: string }> = {
  mileage: { icon: 'car', bg: '#EFF6FF', color: Colors.secondary },
  phone: { icon: 'phone', bg: '#F0FDF4', color: Colors.success },
  office: { icon: 'briefcase', bg: '#FEF9C3', color: Colors.gold[700] },
  equipment: { icon: 'laptop', bg: '#F5F3FF', color: '#7C3AED' },
  travel: { icon: 'plane', bg: '#FFF7ED', color: '#EA580C' },
  food: { icon: 'cutlery', bg: '#FEF2F2', color: Colors.error },
  software: { icon: 'code', bg: '#EFF6FF', color: Colors.secondary },
  insurance: { icon: 'shield', bg: '#F0FDF4', color: Colors.success },
  default: { icon: 'file-text-o', bg: '#F1F5F9', color: Colors.grey[600] },
};

function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_ICONS.default;
  const key = category.toLowerCase();
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

const FREQUENCY_OPTIONS = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
type Frequency = typeof FREQUENCY_OPTIONS[number];

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const FREQUENCY_COLORS: Record<string, { bg: string; color: string }> = {
  weekly: { bg: '#FEF9C3', color: '#A16207' },
  monthly: { bg: '#EFF6FF', color: '#1E3A8A' },
  quarterly: { bg: '#F0FDF4', color: '#16A34A' },
  yearly: { bg: '#F5F3FF', color: '#7C3AED' },
};

const HMRC_CATEGORIES = [
  'office_costs',
  'travel',
  'clothing',
  'staff',
  'stock',
  'financial',
  'premises',
  'legal',
  'marketing',
  'training',
  'other',
] as const;

const HMRC_CATEGORY_LABELS: Record<string, string> = {
  office_costs: 'Office costs',
  travel: 'Travel',
  clothing: 'Clothing',
  staff: 'Staff',
  stock: 'Stock',
  financial: 'Financial',
  premises: 'Premises',
  legal: 'Legal',
  marketing: 'Marketing',
  training: 'Training',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

type ExpenseItem = {
  id: string;
  amount: number;
  description: string;
  date: string;
  hmrc_category?: string;
};

interface ExpenseRowProps {
  item: ExpenseItem;
  index: number;
  totalCount: number;
  onPress: (id: string) => void;
  onDelete: (id: string, desc: string) => void;
  colors: { text: string; textSecondary: string; border: string };
}

const ExpenseRow = React.memo(function ExpenseRow({
  item: exp,
  index,
  totalCount,
  onPress,
  onDelete,
  colors,
}: ExpenseRowProps) {
  const meta = getCategoryMeta(exp.hmrc_category);
  return (
    <Pressable
      onPress={() => onPress(exp.id)}
      style={({ pressed }) => [
        styles.expenseRow,
        index < totalCount - 1 && [styles.expenseRowBorder, { borderBottomColor: colors.border }],
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View expense: ${exp.description}`}
      accessibilityHint="Tap to view expense details"
    >
      <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
        <FontAwesome name={meta.icon} size={16} color={meta.color} />
      </View>
      <View style={styles.expenseMiddle}>
        <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
          {exp.description}
        </Text>
        <View style={styles.expenseSubRow}>
          {exp.hmrc_category ? (
            <View style={[styles.hmrcBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.hmrcBadgeText, { color: meta.color }]}>
                {HMRC_CATEGORY_LABELS[exp.hmrc_category] || exp.hmrc_category}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.expenseSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatDate(exp.date)}
          </Text>
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={[styles.expenseAmount, { color: colors.text }]}>{formatCurrency(exp.amount)}</Text>
        <View style={styles.claimedBadge} accessibilityLabel="Status: Claimed">
          <Text style={styles.claimedBadgeText}>Claimed</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed: p }) => [styles.deleteButton, p && styles.pressed]}
        onPress={(e) => { e.stopPropagation(); onDelete(exp.id, exp.description); }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Delete expense: ${exp.description}`}
        accessibilityHint="Tap to delete this expense"
      >
        <FontAwesome name="trash-o" size={16} color={Colors.error} />
      </Pressable>
    </Pressable>
  );
});

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const { data: dashboardData } = useDashboard();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const [showForm, setShowForm] = useState(false);
  const [openedFromReceipt, setOpenedFromReceipt] = useState(false);
  const [amount, setAmount] = useState('');

  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [expTouched, setExpTouched] = useState<Record<string, boolean>>({});

  // Recurring expenses state
  const { data: recurringData, refetch: refetchRecurring } = useRecurringExpenses();
  const createRecurring = useCreateRecurringExpense();
  const deleteRecurringExpense = useDeleteRecurringExpense();
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recAmount, setRecAmount] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recCategory, setRecCategory] = useState<string>('other');
  const [recFrequency, setRecFrequency] = useState<Frequency>('monthly');
  const [recStartDate, setRecStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recTouched, setRecTouched] = useState<Record<string, boolean>>({});

  const expErrors = useMemo(() => {
    const e: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      e.amount = 'Amount must be greater than 0';
    }
    if (description.trim().length < 3) {
      e.description = 'Description must be at least 3 characters';
    }
    return e;
  }, [amount, description]);

  const isExpenseFormValid = Object.keys(expErrors).length === 0;

  const recErrors = useMemo(() => {
    const e: Record<string, string> = {};
    const parsed = parseFloat(recAmount);
    if (isNaN(parsed) || parsed <= 0) {
      e.amount = 'Amount must be greater than 0';
    }
    if (recDescription.trim().length < 3) {
      e.description = 'Description must be at least 3 characters';
    }
    if (!recStartDate) {
      e.startDate = 'Start date is required';
    }
    return e;
  }, [recAmount, recDescription, recStartDate]);

  const isRecFormValid = Object.keys(recErrors).length === 0;

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

  const handleAdd = async () => {
    if (!isExpenseFormValid) return;
    await addExpense.mutateAsync({
      amount: Number(amount),
      description,
      date: new Date().toISOString().split('T')[0],
      hmrcCategory: selectedCategory,
    });
    hapticSuccess();
    setAmount('');
    setDescription('');
    setSelectedCategory('other');
    setExpTouched({});
    setReceiptUri(null);
    setOpenedFromReceipt(false);
    setShowForm(false);
  };

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

  const handleAddRecurring = async () => {
    if (!isRecFormValid) return;
    await createRecurring.mutateAsync({
      amount: Number(recAmount),
      description: recDescription,
      hmrcCategory: recCategory,
      frequency: recFrequency,
      startDate: recStartDate,
    });
    setRecAmount('');
    setRecDescription('');
    setRecCategory('other');
    setRecFrequency('monthly');
    setRecStartDate(new Date().toISOString().split('T')[0]);
    setRecTouched({});
    setShowRecurringForm(false);
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
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Expenses</Text>
          <Pressable
            style={({ pressed }) => [styles.fabButton, pressed && styles.pressed]}
            onPress={() => setShowForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Add new expense"
            accessibilityHint="Tap to open the add expense form"
          >
            <FontAwesome name="plus" size={16} color={Colors.white} />
          </Pressable>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <Card variant="elevated" style={styles.metricCard} accessibilityLabel={`Total claimed: ${formatCurrency(totalClaimed)}`}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total claimed</Text>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {formatCurrency(totalClaimed)}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.metricCard} accessibilityLabel={`Tax saved: ${formatCurrency(taxSaved)}`}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tax saved</Text>
            <Text style={[styles.metricValue, { color: Colors.secondary }]}>
              {formatCurrency(taxSaved)}
            </Text>
          </Card>
        </View>
        <Card variant="elevated" style={styles.metricCardFull}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>This month</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(thisMonthTotal)}
          </Text>
        </Card>


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
          <FontAwesome name="camera" size={16} color={Colors.white} />
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
          <FontAwesome name="info-circle" size={16} color={Colors.secondary} />
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
              <FlatList
                data={filteredExpenses}
                keyExtractor={(tx) => tx.id}
                renderItem={({ item, index }) => (
                  <ExpenseRow
                    item={item}
                    index={index}
                    totalCount={filteredExpenses.length}
                    onPress={(id) => router.push(`/expense/${id}`)}
                    onDelete={handleDelete}
                    colors={colors}
                  />
                )}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={5}
                scrollEnabled={false}
              />
            </Card>
          </>
        ) : (
          <EmptyState
            icon="receipt-outline"
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
            <FontAwesome name="plus" size={12} color={Colors.white} />
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
                    styles.expenseRow,
                    index < recurringExpenses.length - 1 && [styles.expenseRowBorder, { borderBottomColor: colors.border }],
                  ]}
                >
                  <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
                    <FontAwesome name="refresh" size={16} color={meta.color} />
                  </View>
                  <View style={styles.expenseMiddle}>
                    <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                      {rec.description}
                    </Text>
                    <View style={styles.expenseSubRow}>
                      <View style={[styles.hmrcBadge, { backgroundColor: freqColor.bg }]}>
                        <Text style={[styles.hmrcBadgeText, { color: freqColor.color }]}>
                          {FREQUENCY_LABELS[rec.frequency] ?? rec.frequency}
                        </Text>
                      </View>
                      <Text style={[styles.expenseSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        Next: {formatDate(rec.next_due_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>{formatCurrency(rec.amount)}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                    onPress={() => handleDeleteRecurring(rec.id, rec.description)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Cancel recurring expense: ${rec.description}`}
                  >
                    <FontAwesome name="trash-o" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        ) : (
          <Card variant="elevated" style={styles.recurringEmpty}>
            <FontAwesome name="refresh" size={20} color={colors.textSecondary} />
            <Text style={[styles.recurringEmptyTitle, { color: colors.text }]}>No recurring expenses</Text>
            <Text style={[styles.recurringEmptyText, { color: colors.textSecondary }]}>
              Add monthly subscriptions, rent, or phone bills to auto-log them.
            </Text>
          </Card>
        )}

        {/* Gold Insight Banner */}
        <View style={styles.insightBanner} accessibilityLabel="Tip: Do you use your car for work? Track your mileage to claim up to 45p per mile in tax relief.">
          <FontAwesome name="lightbulb-o" size={18} color={Colors.gold[700]} style={styles.insightIcon} />
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Tip: </Text>
            Do you use your car for work? Track your mileage to claim up to 45p per mile in tax relief.
          </Text>
        </View>

        {/* Auto Mileage Coming Soon Card */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.surface }]}>
          <View style={styles.comingSoonContent}>
            <FontAwesome name="map-marker" size={20} color={Colors.secondary} />
            <View style={styles.comingSoonText}>
              <Text style={[styles.comingSoonTitle, { color: colors.text }]}>Auto mileage tracking</Text>
              <Text style={[styles.comingSoonSub, { color: colors.textSecondary }]}>Coming soon</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>SOON</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]} accessibilityRole="header">New Expense</Text>
              <Pressable onPress={() => { setOpenedFromReceipt(false); setShowForm(false); }} accessibilityRole="button" accessibilityLabel="Close expense form">
                <FontAwesome name="times" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            {openedFromReceipt && (
              <View style={styles.receiptNotice}>
                <FontAwesome name="camera" size={13} color={Colors.secondary} />
                <Text style={[styles.receiptNoticeText, { color: colors.textSecondary }]}>
                  Receipt scanning coming soon — add your expense manually for now.
                </Text>
              </View>
            )}
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: expTouched.amount && expErrors.amount ? Colors.error : colors.border }]}
              placeholder="Amount (e.g. 45.99)"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              onBlur={() => setExpTouched((prev) => ({ ...prev, amount: true }))}
              keyboardType="decimal-pad"
              accessibilityLabel="Expense amount"
              accessibilityHint="Enter the expense amount in pounds"
            />
            {expTouched.amount && expErrors.amount ? (
              <Text style={styles.fieldError}>{expErrors.amount}</Text>
            ) : null}
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: expTouched.description && expErrors.description ? Colors.error : colors.border }]}
              placeholder="Description (min 3 characters)"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              onBlur={() => setExpTouched((prev) => ({ ...prev, description: true }))}
              accessibilityLabel="Expense description"
              accessibilityHint="Describe this expense, minimum 3 characters"
            />
            {expTouched.description && expErrors.description ? (
              <Text style={styles.fieldError}>{expErrors.description}</Text>
            ) : null}
            <Text style={[styles.categoryLabel, { color: colors.text }]}>HMRC Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsContainer}
              style={styles.categoryPillsScroll}
            >
              {HMRC_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryPill,
                      isSelected
                        ? styles.categoryPillSelected
                        : { backgroundColor: colors.background },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Category: ${HMRC_CATEGORY_LABELS[cat]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected
                          ? styles.categoryPillTextSelected
                          : { color: colors.textSecondary },
                      ]}
                    >
                      {HMRC_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, opacity: 0.5 }}>
              <FontAwesome name="camera" size={14} color={colors.textSecondary} />
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: colors.textSecondary }}>
                Receipt scanning — coming soon
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (!isExpenseFormValid || addExpense.isPending) && styles.submitButtonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleAdd}
              disabled={!isExpenseFormValid || addExpense.isPending}
              accessibilityRole="button"
              accessibilityLabel={addExpense.isPending ? 'Adding expense' : 'Add expense'}
              accessibilityHint="Tap to submit the new expense"
              accessibilityState={{ disabled: !isExpenseFormValid || addExpense.isPending }}
            >
              <Text style={styles.submitText}>
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Add Recurring Expense Modal */}
      <Modal visible={showRecurringForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]} accessibilityRole="header">New Recurring Expense</Text>
              <Pressable onPress={() => setShowRecurringForm(false)} accessibilityRole="button" accessibilityLabel="Close recurring expense form">
                <FontAwesome name="times" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: recTouched.amount && recErrors.amount ? Colors.error : colors.border }]}
              placeholder="Amount (e.g. 29.99)"
              placeholderTextColor={colors.textSecondary}
              value={recAmount}
              onChangeText={setRecAmount}
              onBlur={() => setRecTouched((prev) => ({ ...prev, amount: true }))}
              keyboardType="decimal-pad"
              accessibilityLabel="Recurring expense amount"
              accessibilityHint="Enter the recurring expense amount in pounds"
            />
            {recTouched.amount && recErrors.amount ? (
              <Text style={styles.fieldError}>{recErrors.amount}</Text>
            ) : null}
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: recTouched.description && recErrors.description ? Colors.error : colors.border }]}
              placeholder="Description (e.g. Xero subscription)"
              placeholderTextColor={colors.textSecondary}
              value={recDescription}
              onChangeText={setRecDescription}
              onBlur={() => setRecTouched((prev) => ({ ...prev, description: true }))}
              accessibilityLabel="Recurring expense description"
              accessibilityHint="Describe this recurring expense"
            />
            {recTouched.description && recErrors.description ? (
              <Text style={styles.fieldError}>{recErrors.description}</Text>
            ) : null}

            <Text style={[styles.categoryLabel, { color: colors.text }]}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCY_OPTIONS.map((freq) => {
                const isSelected = recFrequency === freq;
                const freqColor = FREQUENCY_COLORS[freq];
                return (
                  <Pressable
                    key={freq}
                    style={[
                      styles.frequencyPill,
                      isSelected
                        ? { backgroundColor: freqColor.bg, borderColor: freqColor.color }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => setRecFrequency(freq)}
                    accessibilityRole="button"
                    accessibilityLabel={`Frequency: ${FREQUENCY_LABELS[freq]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.frequencyPillText,
                        { color: isSelected ? freqColor.color : colors.textSecondary },
                      ]}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.categoryLabel, { color: colors.text }]}>HMRC Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsContainer}
              style={styles.categoryPillsScroll}
            >
              {HMRC_CATEGORIES.map((cat) => {
                const isSelected = recCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryPill,
                      isSelected
                        ? styles.categoryPillSelected
                        : { backgroundColor: colors.background },
                    ]}
                    onPress={() => setRecCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Category: ${HMRC_CATEGORY_LABELS[cat]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected
                          ? styles.categoryPillTextSelected
                          : { color: colors.textSecondary },
                      ]}
                    >
                      {HMRC_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.categoryLabel, { color: colors.text }]}>Start Date</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: recTouched.startDate && recErrors.startDate ? Colors.error : colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={recStartDate}
              onChangeText={setRecStartDate}
              onBlur={() => setRecTouched((prev) => ({ ...prev, startDate: true }))}
              accessibilityLabel="Start date"
              accessibilityHint="Enter the start date in YYYY-MM-DD format"
            />
            {recTouched.startDate && recErrors.startDate ? (
              <Text style={styles.fieldError}>{recErrors.startDate}</Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (!isRecFormValid || createRecurring.isPending) && styles.submitButtonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleAddRecurring}
              disabled={!isRecFormValid || createRecurring.isPending}
              accessibilityRole="button"
              accessibilityLabel={createRecurring.isPending ? 'Adding recurring expense' : 'Add recurring expense'}
              accessibilityState={{ disabled: !isRecFormValid || createRecurring.isPending }}
            >
              <Text style={styles.submitText}>
                {createRecurring.isPending ? 'Adding...' : 'Add Recurring Expense'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.xxl,
  },
  pressed: {
    opacity: 0.85,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },

  /* Metric Cards */
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
  },
  metricCardFull: {
    width: '100%',
    padding: Spacing.md,
  },
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    marginTop: 6,
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
    fontFamily: 'Manrope_600SemiBold',
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: Colors.secondary,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
  },
  itemsBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  itemsBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.success,
  },

  /* Expense List */
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  expenseRowBorder: {
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseMiddle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  expenseDesc: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  expenseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  hmrcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  hmrcBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  expenseSub: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  claimedBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginTop: 3,
  },
  claimedBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: Colors.success,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  /* Gold Insight Banner */
  insightBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.gold[50],
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
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: Colors.gold[700],
    lineHeight: 19,
  },
  insightBold: {
    fontFamily: 'Manrope_700Bold',
  },

  /* Coming Soon Card */
  comingSoonCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.grey[300],
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  comingSoonSub: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  soonBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  soonBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: Colors.secondary,
  },

  /* Modal / Form */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grey[300],
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  input: {
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  categoryPillsScroll: {
    marginBottom: Spacing.sm,
    flexGrow: 0,
  },
  categoryPillsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: Colors.grey[300],
  },
  categoryPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  categoryPillTextSelected: {
    color: Colors.white,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: Colors.white,
  },
  fieldError: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginBottom: Spacing.xs,
    marginTop: -4,
  },
  receiptNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.card,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  receiptNoticeText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },

  /* Recurring Empty State */
  recurringEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  recurringEmptyTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  recurringEmptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },

  /* Frequency Pills */
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  frequencyPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  frequencyPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  categoryChartCard: {
    padding: Spacing.md,
  },
});

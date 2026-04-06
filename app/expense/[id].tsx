import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useExpenses, useDeleteExpense } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { hapticMedium } from '@/lib/haptics';
import type { Expense } from '@/lib/types';

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

function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_ICONS.default;
  const key = category.toLowerCase();
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function ExpenseDetailSkeleton() {
  return (
    <View style={{ gap: Spacing.md }}>
      <Skeleton width="60%" height={28} />
      <Skeleton width="40%" height={16} />
      <View style={{ marginTop: Spacing.lg }}>
        <Skeleton width="100%" height={120} borderRadius={BorderRadius.card} />
      </View>
      <View style={{ marginTop: Spacing.md }}>
        <Skeleton width="100%" height={80} borderRadius={BorderRadius.card} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
        <Skeleton width="48%" height={48} borderRadius={BorderRadius.button} />
        <Skeleton width="48%" height={48} borderRadius={BorderRadius.button} />
      </View>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const deleteMutation = useDeleteExpense();

  // The API returns expenses with snake_case hmrc_category
  const expense = useMemo(() => {
    const expenses = (data?.expenses ?? []) as Array<{
      id: string;
      amount: number;
      description: string;
      date: string;
      hmrc_category?: string;
      hmrcCategory?: string;
      receiptUrl?: string;
      receipt_url?: string;
      createdAt?: string;
      created_at?: string;
    }>;
    return expenses.find((exp) => exp.id === id);
  }, [data, id]);

  const hmrcCategory = expense?.hmrc_category ?? expense?.hmrcCategory;
  const receiptUrl = expense?.receiptUrl ?? expense?.receipt_url;
  const createdAt = expense?.createdAt ?? expense?.created_at;

  const handleDelete = useCallback(async () => {
    if (!expense) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    const doDelete = async () => {
      try {
        await deleteMutation.mutateAsync(expense.id);
        hapticMedium();
        router.back();
      } catch {
        // error handled by mutation
      }
    };

    await doDelete();
  }, [expense, deleteConfirm, deleteMutation, router]);

  const handleEdit = useCallback(() => {
    // Navigate to expenses tab where editing is done
    router.replace('/(tabs)/expenses');
  }, [router]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const categoryMeta = getCategoryMeta(hmrcCategory);

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
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Expense</Text>
          <View style={{ width: 20 }} />
        </View>

        {isLoading ? (
          <ExpenseDetailSkeleton />
        ) : !expense ? (
          <Card style={styles.errorCard}>
            <FontAwesome name="exclamation-triangle" size={32} color={Colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Expense not found</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              This expense may have been deleted or the link is invalid.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/expenses')}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>View All Expenses</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            {/* Category Icon & Description */}
            <View style={styles.topSection}>
              <View style={[styles.categoryIconLarge, { backgroundColor: categoryMeta.bg }]}>
                <FontAwesome name={categoryMeta.icon} size={28} color={categoryMeta.color} />
              </View>
              <Text style={[styles.expenseDescription, { color: colors.text }]}>
                {expense.description}
              </Text>
              {hmrcCategory ? (
                <View style={[styles.categoryBadge, { backgroundColor: categoryMeta.bg }]}>
                  <Text style={[styles.categoryBadgeText, { color: categoryMeta.color }]}>
                    {HMRC_CATEGORY_LABELS[hmrcCategory] || hmrcCategory}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Amount Card */}
            <Card variant="elevated" style={styles.amountCard}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.amountValue, { color: Colors.success }]}>
                {formatCurrency(expense.amount)}
              </Text>
            </Card>

            {/* Details Card */}
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(expense.date)}</Text>
              </View>
              {hmrcCategory ? (
                <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>HMRC Category</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {HMRC_CATEGORY_LABELS[hmrcCategory] || hmrcCategory}
                  </Text>
                </View>
              ) : null}
              {createdAt ? (
                <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Added</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(createdAt)}</Text>
                </View>
              ) : null}
            </Card>

            {/* Receipt Image */}
            {receiptUrl ? (
              <Card style={styles.receiptCard}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Receipt</Text>
                <Image
                  source={{ uri: receiptUrl }}
                  style={styles.receiptImage}
                  resizeMode="contain"
                  accessibilityLabel="Receipt image"
                />
              </Card>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <FontAwesome name="pencil" size={16} color={Colors.secondary} style={styles.actionIcon} />
                <Text style={[styles.actionButtonTextDark, { color: colors.text }]}>Edit Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton, deleteMutation.isPending && styles.actionButtonDisabled]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                activeOpacity={0.8}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={Colors.error} size="small" />
                ) : (
                  <>
                    <FontAwesome name="trash-o" size={16} color={Colors.error} style={styles.actionIcon} />
                    <Text style={styles.deleteButtonText}>
                      {deleteConfirm ? 'Tap again to confirm' : 'Delete Expense'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },

  // Top section
  topSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  categoryIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  expenseDescription: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  categoryBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },

  // Amount card
  amountCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  amountLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 36,
  },

  // Details card
  detailsCard: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    paddingVertical: Spacing.sm,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
  detailLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },

  // Receipt
  receiptCard: {
    marginBottom: Spacing.lg,
  },
  receiptLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  receiptImage: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.input,
  },

  // Actions
  actionsSection: {
    gap: Spacing.sm,
  },
  actionButton: {
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonTextDark: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.grey[300],
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: Colors.error,
  },

  // Error state
  errorCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    marginTop: Spacing.sm,
  },
  errorSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
});

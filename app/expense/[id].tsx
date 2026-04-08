import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Car, Phone, Briefcase, Laptop, Plane, Utensils, Code, Shield, FileText, Image as ImageIcon, Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useExpenses, useDeleteExpense, useUpdateExpense } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { hapticMedium } from '@/lib/haptics';
import type { Expense } from '@/lib/types';

const CATEGORY_ICONS: Record<string, { Icon: React.ComponentType<any>; bg: string; color: string }> = {
  mileage: { Icon: Car, bg: 'rgba(0,102,255,0.12)', color: Colors.secondary },
  phone: { Icon: Phone, bg: 'rgba(0,200,83,0.12)', color: Colors.success },
  office: { Icon: Briefcase, bg: 'rgba(0,102,255,0.12)', color: Colors.secondary },
  equipment: { Icon: Laptop, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  travel: { Icon: Plane, bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  food: { Icon: Utensils, bg: 'rgba(255,59,48,0.12)', color: Colors.error },
  software: { Icon: Code, bg: 'rgba(0,102,255,0.12)', color: Colors.secondary },
  insurance: { Icon: Shield, bg: 'rgba(0,200,83,0.12)', color: Colors.success },
  default: { Icon: FileText, bg: '#2A2A2A', color: '#666666' },
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
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [imageError, setImageError] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const deleteMutation = useDeleteExpense();
  const updateMutation = useUpdateExpense();

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
    if (!expense) return;
    const cat = expense.hmrc_category ?? expense.hmrcCategory ?? '';
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description);
    setEditDate(expense.date);
    setEditCategory(cat);
    setIsEditing(true);
    setDeleteConfirm(false);
  }, [expense]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!expense) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!editDescription.trim()) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDate)) return;

    try {
      await updateMutation.mutateAsync({
        id: expense.id,
        data: {
          amount,
          description: editDescription.trim(),
          date: editDate,
          hmrcCategory: editCategory || undefined,
        },
      });
      hapticMedium();
      setIsEditing(false);
      refetch();
    } catch {
      // error handled by mutation
    }
  }, [expense, editAmount, editDescription, editDate, editCategory, updateMutation, refetch]);

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
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Expense</Text>
          <View style={{ width: 20 }} />
        </View>

        {isLoading ? (
          <ExpenseDetailSkeleton />
        ) : !expense ? (
          <Card style={styles.errorCard}>
            <AlertTriangle size={32} color={Colors.error} strokeWidth={1.5} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Expense not found</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              This expense may have been deleted or the link is invalid.
            </Text>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/expenses')}
             
            >
              <Text style={styles.backButtonText}>View All Expenses</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            {isEditing ? (
              <>
                {/* Edit Mode */}
                <Card style={styles.editCard}>
                  <Text style={[styles.editSectionTitle, { color: colors.text }]}>Edit Expense</Text>

                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Amount</Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={'#666666'}
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Description</Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="What was this expense for?"
                      placeholderTextColor={'#666666'}
                      maxLength={500}
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={editDate}
                      onChangeText={setEditDate}
                      placeholder="2026-01-15"
                      placeholderTextColor={'#666666'}
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.textSecondary }]}>HMRC Category</Text>
                    <View style={styles.categoryPicker}>
                      {HMRC_CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          style={[
                            styles.categoryChip,
                            { borderColor: colors.border },
                            editCategory === cat && styles.categoryChipSelected,
                          ]}
                          onPress={() => setEditCategory(editCategory === cat ? '' : cat)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: colors.textSecondary },
                              editCategory === cat && styles.categoryChipTextSelected,
                            ]}
                          >
                            {HMRC_CATEGORY_LABELS[cat]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </Card>

                {/* Save / Cancel Buttons */}
                <View style={styles.actionsSection}>
                  <Pressable
                    style={[styles.actionButton, styles.saveButton, updateMutation.isPending && styles.actionButtonDisabled]}
                    onPress={handleSave}
                    disabled={updateMutation.isPending}
                   
                  >
                    {updateMutation.isPending ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Check size={16} color={Colors.white} strokeWidth={1.5} style={styles.actionIcon} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={handleCancelEdit}
                   
                  >
                    <X size={16} color={Colors.secondary} strokeWidth={1.5} style={styles.actionIcon} />
                    <Text style={[styles.actionButtonTextDark, { color: colors.text }]}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* Category Icon & Description */}
                <View style={styles.topSection}>
                  <View style={[styles.categoryIconLarge, { backgroundColor: categoryMeta.bg }]}>
                    <categoryMeta.Icon size={28} color={categoryMeta.color} strokeWidth={1.5} />
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
                    {imageError ? (
                      <View style={styles.receiptFallback}>
                        <ImageIcon size={32} color="#666666" strokeWidth={1.5} />
                        <Text style={[styles.receiptFallbackText, { color: colors.textSecondary }]}>
                          Receipt unavailable
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: receiptUrl }}
                        style={styles.receiptImage}
                        resizeMode="contain"
                        accessibilityLabel="Receipt image"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </Card>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={handleEdit}
                   
                  >
                    <Pencil size={16} color={Colors.secondary} strokeWidth={1.5} style={styles.actionIcon} />
                    <Text style={[styles.actionButtonTextDark, { color: colors.text }]}>Edit Expense</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.deleteButton, deleteMutation.isPending && styles.actionButtonDisabled]}
                    onPress={handleDelete}
                    disabled={deleteMutation.isPending}
                   
                  >
                    {deleteMutation.isPending ? (
                      <ActivityIndicator color={Colors.error} size="small" />
                    ) : (
                      <>
                        <Trash2 size={16} color={Colors.error} strokeWidth={1.5} style={styles.actionIcon} />
                        <Text style={styles.deleteButtonText}>
                          {deleteConfirm ? 'Tap again to confirm' : 'Delete Expense'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
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
    fontFamily: Fonts.lexend.semiBold,
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
    fontFamily: Fonts.lexend.semiBold,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },

  // Amount card
  amountCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  amountLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontFamily: Fonts.mono.semiBold,
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },

  // Receipt
  receiptCard: {
    marginBottom: Spacing.lg,
  },
  receiptLabel: {
    fontFamily: Fonts.sourceSans.regular,
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
  receiptFallback: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.input,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  receiptFallbackText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.error,
  },

  // Edit mode
  editCard: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  editSectionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  editField: {
    gap: 6,
  },
  editLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editInput: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryChipText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.accent,
  },
  saveButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },

  // Error state
  errorCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 18,
    marginTop: Spacing.sm,
  },
  errorSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
});

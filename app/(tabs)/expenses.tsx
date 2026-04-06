import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useExpenses, useAddExpense, useApiToken } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default function ExpensesScreen() {
  useApiToken();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const addExpense = useAddExpense();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const expenses = (data?.expenses ?? []) as {
    id: string;
    amount: number;
    description: string;
    date: string;
    hmrc_category?: string;
  }[];
  const totalClaimed = expenses.reduce((sum, e) => sum + e.amount, 0);
  const taxSaved = totalClaimed * 0.2;

  const handleAdd = async () => {
    if (!amount || !description || !/^[0-9]+(\.[0-9]{1,2})?$/.test(amount)) return;
    await addExpense.mutateAsync({
      amount: Number(amount),
      description,
      date: new Date().toISOString().split('T')[0],
    });
    setAmount('');
    setDescription('');
    setShowForm(false);
  };

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
          <Text style={[styles.title, { color: colors.text }]}>Expenses</Text>
          <Pressable
            style={({ pressed }) => [styles.fabButton, pressed && styles.pressed]}
            onPress={() => setShowForm(true)}
          >
            <FontAwesome name="plus" size={16} color={Colors.white} />
          </Pressable>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total claimed</Text>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {formatCurrency(totalClaimed)}
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tax saved</Text>
            <Text style={[styles.metricValue, { color: Colors.secondary }]}>
              {formatCurrency(taxSaved)}
            </Text>
          </Card>
        </View>

        {/* Scan Receipt Button */}
        <Pressable
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
          onPress={() => setShowForm(true)}
        >
          <FontAwesome name="camera" size={16} color={Colors.white} />
          <Text style={styles.scanButtonText}>Scan receipt</Text>
        </Pressable>

        {/* What Can I Claim Button */}
        <Pressable
          style={({ pressed }) => [styles.outlineButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/learn')}
        >
          <FontAwesome name="info-circle" size={16} color={Colors.secondary} />
          <Text style={styles.outlineButtonText}>What can I claim? See the full list</Text>
        </Pressable>

        {/* Claimed Expenses Section */}
        {isLoading ? (
          <SkeletonCard />
        ) : expenses.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Claimed expenses</Text>
              <View style={styles.itemsBadge}>
                <Text style={styles.itemsBadgeText}>{expenses.length} items</Text>
              </View>
            </View>

            <Card style={styles.listCard}>
              {expenses.map((exp, index) => {
                const meta = getCategoryMeta(exp.hmrc_category);
                return (
                  <View
                    key={exp.id}
                    style={[
                      styles.expenseRow,
                      index < expenses.length - 1 && [styles.expenseRowBorder, { borderBottomColor: colors.border }],
                    ]}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: meta.bg }]}>
                      <FontAwesome name={meta.icon} size={16} color={meta.color} />
                    </View>
                    <View style={styles.expenseMiddle}>
                      <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>
                        {exp.description}
                      </Text>
                      <Text style={[styles.expenseSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {exp.hmrc_category || 'Expense'} · {formatDate(exp.date)}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={[styles.expenseAmount, { color: colors.text }]}>{formatCurrency(exp.amount)}</Text>
                      <View style={styles.claimedBadge}>
                        <Text style={styles.claimedBadgeText}>Claimed</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <FontAwesome name="file-text-o" size={32} color={Colors.grey[400]} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No expenses yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add business expenses to reduce your tax bill. Every little helps!
              </Text>
            </View>
          </Card>
        )}

        {/* Gold Insight Banner */}
        <View style={styles.insightBanner}>
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
            <View style={styles.modalHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>New Expense</Text>
              <Pressable onPress={() => setShowForm(false)}>
                <FontAwesome name="times" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Amount (e.g. 45.99)"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />
            <Pressable
              style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
              onPress={handleAdd}
            >
              <Text style={styles.submitText}>
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
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
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 19,
  },
  fabButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
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
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  metricValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    marginTop: 4,
  },

  /* Scan Receipt Button */
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    ...Shadows.soft,
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
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 18,
  },
  input: {
    borderRadius: BorderRadius.input,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: Colors.white,
  },
});

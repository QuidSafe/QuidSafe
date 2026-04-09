import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Wand2, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, PressedState } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTransactions, useUncategorised, useOverrideCategory } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import type { Transaction, TransactionCategory } from '@/lib/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterType = 'all' | 'income' | 'business' | 'personal' | 'uncategorised';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'business', label: 'Business' },
  { key: 'personal', label: 'Personal' },
  { key: 'uncategorised', label: 'Uncategorised' },
];

const INCOME_SOURCES = ['freelance', 'rental', 'investment', 'other'] as const;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function getCategoryColor(category: TransactionCategory | undefined): string {
  switch (category) {
    case 'income':
      return Colors.success;
    case 'business_expense':
      return Colors.secondary;
    case 'personal':
      return '#666666';
    default:
      return '#2A2A2A';
  }
}

function getCategoryLabel(category: TransactionCategory | undefined): string {
  switch (category) {
    case 'income':
      return 'Income';
    case 'business_expense':
      return 'Business';
    case 'personal':
      return 'Personal';
    default:
      return 'Uncategorised';
  }
}

interface TransactionCardProps {
  tx: Transaction;
  onPress: (tx: Transaction) => void;
  renderConfidenceBadge: (tx: Transaction) => React.ReactNode;
  colors: { text: string; textSecondary: string };
}

const TransactionCard = React.memo(function TransactionCard({
  tx,
  onPress,
  renderConfidenceBadge,
  colors,
}: TransactionCardProps) {
  const isIncome = tx.isIncome;
  const confidence = tx.aiConfidence ?? 0;
  const isLowConfidence = confidence < 0.5 && !tx.userOverride;

  return (
    <Pressable
      onPress={() => onPress(tx)}
      style={({ pressed }) => [pressed && styles.pressedCard]}
    >
      <Card
        variant={isLowConfidence ? 'elevated' : 'glass'}
        style={[
          styles.txCard,
          isLowConfidence && { borderColor: Colors.error + '30' },
        ]}
      >
        <View style={styles.txRow}>
          <View style={styles.txLeft}>
            <Text
              style={[styles.txMerchant, { color: colors.text }]}
              numberOfLines={1}
            >
              {tx.merchantName || tx.description}
            </Text>
            <Text style={[styles.txDate, { color: colors.textSecondary }]}>
              {formatDate(tx.transactionDate)}
            </Text>
          </View>
          <View style={styles.txRight}>
            <Text
              style={[
                styles.txAmount,
                { color: isIncome ? Colors.success : colors.text },
              ]}
            >
              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
            </Text>
            {renderConfidenceBadge(tx)}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const initialFilter = (params.filter as FilterType) || 'all';
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<string | null>(null);
  const [isAutoCategorising, setIsAutoCategorising] = useState(false);

  const { colors } = useTheme();
  const toast = useToast();

  // Fetch data based on filter
  const categoryParam = activeFilter === 'income' ? 'income'
    : activeFilter === 'business' ? 'business_expense'
    : activeFilter === 'personal' ? 'personal'
    : undefined;

  const transactionsQuery = useTransactions(
    activeFilter !== 'uncategorised' ? { limit: 100, category: categoryParam } : undefined,
  );
  const uncategorisedQuery = useUncategorised();
  const overrideMutation = useOverrideCategory();

  const isUncategorisedFilter = activeFilter === 'uncategorised';
  const isLoading = isUncategorisedFilter ? uncategorisedQuery.isLoading : transactionsQuery.isLoading;
  const isRefetching = isUncategorisedFilter ? uncategorisedQuery.isRefetching : transactionsQuery.isRefetching;

  const transactions: Transaction[] = isUncategorisedFilter
    ? (uncategorisedQuery.data?.transactions ?? [])
    : (transactionsQuery.data?.transactions ?? []);

  const refetch = useCallback(() => {
    if (isUncategorisedFilter) {
      uncategorisedQuery.refetch();
    } else {
      transactionsQuery.refetch();
    }
  }, [isUncategorisedFilter, uncategorisedQuery, transactionsQuery]);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading, fadeAnim, slideAnim]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  }, []);

  const handleTransactionPress = useCallback((tx: Transaction) => {
    setSelectedTransaction(tx);
    setSelectedCategory(tx.aiCategory ?? null);
    setSelectedIncomeSource(tx.incomeSource ?? null);
  }, []);

  const handleConfirmOverride = useCallback(async () => {
    if (!selectedTransaction || !selectedCategory) return;

    try {
      await overrideMutation.mutateAsync({
        id: selectedTransaction.id,
        category: selectedCategory,
        incomeSource: selectedCategory === 'income' ? (selectedIncomeSource ?? undefined) : undefined,
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedTransaction(null);
      setSelectedCategory(null);
      setSelectedIncomeSource(null);
    } catch {
      Alert.alert('Error', 'Failed to update category. Please try again.');
    }
  }, [selectedTransaction, selectedCategory, selectedIncomeSource, overrideMutation]);

  const handleAutoCategorise = useCallback(async () => {
    setIsAutoCategorising(true);
    try {
      const result = await api.categoriseTransactions();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      toast.show(
        `${result.categorised} categorised, ${result.flaggedForReview} need review`,
        result.flaggedForReview > 0 ? 'warning' : 'success',
      );
      transactionsQuery.refetch();
      uncategorisedQuery.refetch();
    } catch {
      Alert.alert('Error', 'Failed to auto-categorise. Please try again.');
    } finally {
      setIsAutoCategorising(false);
    }
  }, [transactionsQuery, uncategorisedQuery, toast]);

  const renderConfidenceBadge = useCallback(
    (tx: Transaction) => {
      const confidence = tx.aiConfidence ?? 0;
      const percentage = Math.round(confidence * 100);

      if (tx.userOverride) {
        return (
          <View style={[styles.badge, { backgroundColor: Colors.accent + '20', borderColor: Colors.accent }]}>
            <Text style={[styles.badgeText, { color: Colors.accent }]}>Manual</Text>
          </View>
        );
      }

      if (confidence >= 0.8) {
        return (
          <View style={[styles.badge, { backgroundColor: getCategoryColor(tx.aiCategory) + '15', borderColor: getCategoryColor(tx.aiCategory) }]}>
            <Text style={[styles.badgeText, { color: getCategoryColor(tx.aiCategory) }]}>
              {getCategoryLabel(tx.aiCategory)}
            </Text>
          </View>
        );
      }

      if (confidence >= 0.5) {
        return (
          <View style={[styles.badge, { backgroundColor: 'transparent', borderColor: getCategoryColor(tx.aiCategory), borderStyle: 'dashed' }]}>
            <Text style={[styles.badgeText, { color: getCategoryColor(tx.aiCategory) }]}>
              {getCategoryLabel(tx.aiCategory)} {percentage}%
            </Text>
          </View>
        );
      }

      return (
        <View style={[styles.badge, { backgroundColor: Colors.error + '10', borderColor: Colors.error }]}>
          <AlertCircle size={10} color={Colors.error} strokeWidth={1.5} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: Colors.error }]}>Review</Text>
        </View>
      );
    },
    [],
  );

  const showEmptyUncategorised = isUncategorisedFilter && !isLoading && transactions.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
          <Pressable
            onPress={handleAutoCategorise}
            disabled={isAutoCategorising}
            style={({ pressed }) => [
              styles.autoCategoriseButton,
              { backgroundColor: Colors.secondary + (isAutoCategorising ? '40' : 'FF') },
              pressed && PressedState,
            ]}
          >
            <Wand2 size={13} color={Colors.white} strokeWidth={1.5} />
            <Text style={styles.autoCategoriseText}>
              {isAutoCategorising ? 'Working...' : 'Auto-categorise'}
            </Text>
          </Pressable>
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => handleFilterChange(f.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive
                      ? Colors.accent
                      : '#0A0A0A',
                    borderColor: isActive
                      ? 'transparent'
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive
                        ? Colors.white
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : showEmptyUncategorised ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.tint} />
          }
        >
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.success + '15' }]}>
              <CheckCircle size={40} color={Colors.success} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No transactions need review.
            </Text>
          </Animated.View>
        </ScrollView>
      ) : (
        <Animated.View style={[styles.flatListWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <FlatList
            data={transactions}
            keyExtractor={(tx) => tx.id}
            renderItem={({ item }) => (
              <TransactionCard
                tx={item}
                onPress={handleTransactionPress}
                renderConfidenceBadge={renderConfidenceBadge}
                colors={colors}
              />
            )}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.tint} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No transactions found for this filter.
                </Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* Review Bottom Sheet Modal */}
      <Modal
        visible={selectedTransaction !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedTransaction(null)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            {selectedTransaction && (
              <>
                {/* Handle bar */}
                <View style={styles.modalHandle}>
                  <View style={[styles.modalHandleBar, { backgroundColor: colors.border }]} />
                </View>

                {/* Transaction details */}
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedTransaction.merchantName || selectedTransaction.description}
                </Text>

                <View style={styles.modalDetailsRow}>
                  <View style={styles.modalDetail}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>Amount</Text>
                    <Text
                      style={[
                        styles.modalDetailValue,
                        { color: selectedTransaction.isIncome ? Colors.success : colors.text },
                      ]}
                    >
                      {selectedTransaction.isIncome ? '+' : '-'}
                      {formatCurrency(Math.abs(selectedTransaction.amount))}
                    </Text>
                  </View>
                  <View style={styles.modalDetail}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>Date</Text>
                    <Text style={[styles.modalDetailValue, { color: colors.text }]}>
                      {formatDate(selectedTransaction.transactionDate)}
                    </Text>
                  </View>
                </View>

                {selectedTransaction.description && selectedTransaction.merchantName && (
                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                    {selectedTransaction.description}
                  </Text>
                )}

                {/* AI suggestion */}
                <View style={[styles.aiSuggestion, { backgroundColor: '#0A0A0A' }]}>
                  <View style={styles.aiSuggestionHeader}>
                    <Lightbulb size={14} color={Colors.accent} strokeWidth={1.5} />
                    <Text style={[styles.aiSuggestionTitle, { color: colors.text }]}>
                      AI thinks this is:{' '}
                      <Text style={{ color: getCategoryColor(selectedTransaction.aiCategory) }}>
                        {getCategoryLabel(selectedTransaction.aiCategory)}
                      </Text>
                    </Text>
                  </View>
                  {selectedTransaction.aiConfidence !== undefined && (
                    <Text style={[styles.aiConfidenceText, { color: colors.textSecondary }]}>
                      Confidence: {Math.round(selectedTransaction.aiConfidence * 100)}%
                    </Text>
                  )}
                  {selectedTransaction.aiReasoning && (
                    <Text style={[styles.aiReasoningText, { color: colors.textSecondary }]}>
                      {selectedTransaction.aiReasoning}
                    </Text>
                  )}
                </View>

                {/* Category selection */}
                <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                  Choose category
                </Text>
                <View style={styles.categoryButtons}>
                  {([
                    { key: 'income' as TransactionCategory, label: 'Income', color: Colors.success },
                    { key: 'business_expense' as TransactionCategory, label: 'Business Expense', color: Colors.secondary },
                    { key: 'personal' as TransactionCategory, label: 'Personal', color: '#666666' },
                  ]).map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        onPress={() => {
                          setSelectedCategory(cat.key);
                          if (cat.key !== 'income') setSelectedIncomeSource(null);
                        }}
                        style={[
                          styles.categoryButton,
                          {
                            backgroundColor: isSelected ? cat.color + '20' : '#0A0A0A',
                            borderColor: isSelected ? cat.color : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            { color: isSelected ? cat.color : colors.textSecondary },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Income source picker */}
                {selectedCategory === 'income' && (
                  <View style={styles.incomeSourceSection}>
                    <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                      Income source
                    </Text>
                    <View style={styles.incomeSourceRow}>
                      {INCOME_SOURCES.map((src) => {
                        const isSelected = selectedIncomeSource === src;
                        return (
                          <Pressable
                            key={src}
                            onPress={() => setSelectedIncomeSource(src)}
                            style={[
                              styles.incomeSourcePill,
                              {
                                backgroundColor: isSelected ? Colors.accent + '20' : '#0A0A0A',
                                borderColor: isSelected ? Colors.accent : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.incomeSourceText,
                                { color: isSelected ? Colors.accent : colors.textSecondary },
                              ]}
                            >
                              {src.charAt(0).toUpperCase() + src.slice(1)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Confirm button */}
                <Pressable
                  onPress={handleConfirmOverride}
                  disabled={!selectedCategory || overrideMutation.isPending}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    {
                      backgroundColor: selectedCategory
                        ? Colors.accent
                        : Colors.midGrey,
                      opacity: overrideMutation.isPending ? 0.6 : pressed ? PressedState.opacity : 1,
                    },
                  ]}
                >
                  <Text style={styles.confirmButtonText}>
                    {overrideMutation.isPending ? 'Saving...' : 'Confirm'}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListWrapper: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  autoCategoriseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  autoCategoriseText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    color: Colors.white,
  },

  // Filter pills
  filterScroll: {
    marginTop: Spacing.md,
  },
  filterRow: {
    gap: 8,
    paddingRight: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  filterPillText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },

  // Transaction list
  scroll: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: 10,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },

  // Transaction card
  txCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  txMerchant: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },
  txDate: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 16,
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },

  // Press state
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 22,
  },
  emptySubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 20,
    marginBottom: 12,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  modalDetail: {
    gap: 2,
  },
  modalDetailLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDetailValue: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 18,
  },
  modalDescription: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    marginBottom: 16,
  },

  // AI suggestion box
  aiSuggestion: {
    borderRadius: BorderRadius.card,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSuggestionTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  aiConfidenceText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    marginLeft: 22,
  },
  aiReasoningText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 22,
    marginTop: 2,
  },

  // Category buttons
  modalSectionLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },

  // Income source picker
  incomeSourceSection: {
    marginBottom: 16,
  },
  incomeSourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  incomeSourcePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  incomeSourceText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },

  // Confirm button
  confirmButton: {
    borderRadius: BorderRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmButtonText: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
});

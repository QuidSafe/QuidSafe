import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAddExpense } from '@/lib/hooks/useApi';
import { hapticSuccess } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import { HMRC_CATEGORY_LABELS } from '@/components/ui/ExpenseRow';

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

export interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  openedFromReceipt?: boolean;
}

export default function AddExpenseModal({ visible, onClose, onSuccess, openedFromReceipt = false }: AddExpenseModalProps) {
  const { colors } = useTheme();
  const addExpense = useAddExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [expTouched, setExpTouched] = useState<Record<string, boolean>>({});

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
    onSuccess();
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory('other');
    setExpTouched({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.formTitle, { color: colors.text }]} accessibilityRole="header">New Expense</Text>
            <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close expense form">
              <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </View>
          {openedFromReceipt && (
            <View style={styles.receiptNotice}>
              <Camera size={13} color={Colors.secondary} strokeWidth={1.5} />
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
            <Camera size={14} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontFamily: Fonts.sourceSans.regular, fontSize: 13, color: colors.textSecondary }}>
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
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A2A2A',
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
    fontFamily: Fonts.lexend.bold,
    fontSize: 18,
  },
  input: {
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
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
    borderColor: '#2A2A2A',
  },
  categoryPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },
  categoryPillTextSelected: {
    color: Colors.white,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  fieldError: {
    fontFamily: Fonts.sourceSans.regular,
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
  },
});

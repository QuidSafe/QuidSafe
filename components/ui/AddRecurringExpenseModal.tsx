import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useCreateRecurringExpense } from '@/lib/hooks/useApi';
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

export const FREQUENCY_OPTIONS = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
export type Frequency = typeof FREQUENCY_OPTIONS[number];

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const FREQUENCY_COLORS: Record<string, { bg: string; color: string }> = {
  weekly: { bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  monthly: { bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
  quarterly: { bg: 'rgba(0,200,83,0.12)', color: '#00C853' },
  yearly: { bg: 'rgba(0,102,255,0.12)', color: '#0066FF' },
};

export interface AddRecurringExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRecurringExpenseModal({ visible, onClose, onSuccess }: AddRecurringExpenseModalProps) {
  const { colors } = useTheme();
  const createRecurring = useCreateRecurringExpense();

  const [recAmount, setRecAmount] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recCategory, setRecCategory] = useState<string>('other');
  const [recFrequency, setRecFrequency] = useState<Frequency>('monthly');
  const [recStartDate, setRecStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recTouched, setRecTouched] = useState<Record<string, boolean>>({});

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

  const handleAdd = async () => {
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
    onSuccess();
  };

  const handleClose = () => {
    setRecAmount('');
    setRecDescription('');
    setRecCategory('other');
    setRecFrequency('monthly');
    setRecStartDate(new Date().toISOString().split('T')[0]);
    setRecTouched({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.formTitle, { color: colors.text }]} accessibilityRole="header">New Recurring Expense</Text>
            <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close recurring expense form">
              <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
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
            onPress={handleAdd}
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
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
});

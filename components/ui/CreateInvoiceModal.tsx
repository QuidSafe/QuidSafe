import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { DateInput } from '@/components/ui/DateInput';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useCreateInvoiceWithToast } from '@/lib/hooks/useApiWithToast';
import { hapticSuccess } from '@/lib/haptics';

interface CreateInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInvoiceModal({ visible, onClose, onSuccess }: CreateInvoiceModalProps) {
  const { colors } = useTheme();
  const createMutation = useCreateInvoiceWithToast();

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const resetForm = useCallback(() => {
    setClientName('');
    setClientEmail('');
    setAmount('');
    setDescription('');
    setDueDate('');
    setTouched({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Today in YYYY-MM-DD for minDate
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Validation
  const parsedAmount = parseFloat(amount);
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (clientName.trim().length < 2) {
      e.clientName = 'Client name must be at least 2 characters';
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      e.amount = 'Amount must be greater than 0';
    }
    if (description.trim().length < 3) {
      e.description = 'Description must be at least 3 characters';
    }
    if (!dueDate.trim()) {
      e.dueDate = 'Due date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        e.dueDate = 'Please enter a valid date';
      } else if (due < today) {
        e.dueDate = 'Due date must be today or in the future';
      }
    }
    return e;
  }, [clientName, parsedAmount, description, dueDate]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleCreate = useCallback(async () => {
    if (!isFormValid) return;
    try {
      await createMutation.mutateAsync({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        amount: parsedAmount,
        description: description.trim(),
        dueDate: dueDate.trim(),
      });
      hapticSuccess();
      resetForm();
      onSuccess();
    } catch {
      // toast handled by useCreateInvoiceWithToast
    }
  }, [isFormValid, createMutation, clientName, clientEmail, parsedAmount, description, dueDate, resetForm, onSuccess]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Invoice</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close invoice form"
              >
                <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Client Name */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Client name</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: touched.clientName && errors.clientName ? Colors.error : colors.border,
                },
              ]}
              placeholder="e.g. Acme Ltd"
              placeholderTextColor={colors.textSecondary}
              value={clientName}
              onChangeText={setClientName}
              onBlur={() => markTouched('clientName')}
              accessibilityLabel="Client name"
              accessibilityHint="Enter the client or company name for this invoice"
            />
            {touched.clientName && errors.clientName ? (
              <Text style={styles.fieldError}>{errors.clientName}</Text>
            ) : null}

            {/* Client Email (optional) */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Client email (optional)</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              placeholder="client@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={clientEmail}
              onChangeText={setClientEmail}
              accessibilityLabel="Client email"
              accessibilityHint="Optionally enter the client's email address"
            />

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: touched.amount && errors.amount ? Colors.error : colors.border,
                },
              ]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              onBlur={() => markTouched('amount')}
              accessibilityLabel="Invoice amount"
              accessibilityHint="Enter the invoice amount in pounds"
            />
            {touched.amount && errors.amount ? (
              <Text style={styles.fieldError}>{errors.amount}</Text>
            ) : null}

            {/* Description */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[
                styles.modalInput,
                styles.modalInputMultiline,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: touched.description && errors.description ? Colors.error : colors.border,
                },
              ]}
              placeholder="What is this invoice for?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              onBlur={() => markTouched('description')}
              accessibilityLabel="Invoice description"
              accessibilityHint="Describe what this invoice is for"
            />
            {touched.description && errors.description ? (
              <Text style={styles.fieldError}>{errors.description}</Text>
            ) : null}

            {/* Due Date */}
            <DateInput
              label="Due date"
              value={dueDate}
              onChange={(date) => {
                setDueDate(date);
                markTouched('dueDate');
              }}
              minDate={todayStr}
              error={touched.dueDate ? errors.dueDate : undefined}
            />

            {/* Submit button */}
            <Pressable
              style={[
                styles.submitButton,
                (!isFormValid || createMutation.isPending) && styles.submitButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!isFormValid || createMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Create invoice"
              accessibilityHint="Tap to create a new invoice"
              accessibilityState={{ disabled: !isFormValid || createMutation.isPending }}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Invoice</Text>
              )}
            </Pressable>

            {createMutation.isError && (
              <Text style={styles.errorText}>
                Failed to create invoice. Please try again.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
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
  modalTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
  },
  fieldLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  modalInput: {
    fontFamily: Fonts.sourceSans.regular,
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
  fieldError: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.error,
    marginBottom: Spacing.xs,
    marginTop: -2,
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
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  errorText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

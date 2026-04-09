import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, FileText, Pencil, Trash2, AlertTriangle, Send, X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useInvoices } from '@/lib/hooks/useApi';
import {
  useUpdateInvoiceWithToast,
  useDeleteInvoiceWithToast,
  useSendInvoiceWithToast,
} from '@/lib/hooks/useApiWithToast';
import { formatCurrency } from '@/lib/tax-engine';
import { downloadInvoicePDF } from '@/lib/invoiceActions';
import { hapticSuccess, hapticMedium } from '@/lib/haptics';
import type { Invoice, InvoiceStatus } from '@/lib/types';

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: '#2A2A2A', text: '#666666' },
  sent: { bg: 'rgba(0,102,255,0.12)', text: Colors.secondary },
  paid: { bg: 'rgba(0,200,83,0.12)', text: Colors.success },
  overdue: { bg: 'rgba(255,59,48,0.12)', text: Colors.error },
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function InvoiceDetailSkeleton() {
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

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [sendEmail, setSendEmail] = useState('');

  const { data, isLoading, refetch, isRefetching } = useInvoices(undefined);
  const updateMutation = useUpdateInvoiceWithToast();
  const deleteMutation = useDeleteInvoiceWithToast();
  const sendMutation = useSendInvoiceWithToast();

  const invoice: Invoice | undefined = useMemo(() => {
    const invoices = data?.invoices ?? [];
    return invoices.find((inv: Invoice) => inv.id === id);
  }, [data, id]);

  const isMutating = updateMutation.isPending || deleteMutation.isPending || sendMutation.isPending;

  const handleMarkPaid = useCallback(async () => {
    if (!invoice) return;
    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        data: { status: 'paid' },
      });
      hapticSuccess();
    } catch {
      // toast handled by hook
    }
  }, [invoice, updateMutation]);

  const handleDownloadPDF = useCallback(() => {
    if (!invoice) return;
    downloadInvoicePDF(invoice);
  }, [invoice]);

  const handleDelete = useCallback(async () => {
    if (!invoice) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync(invoice.id);
      hapticMedium();
      router.back();
    } catch {
      // toast handled by hook
    }
  }, [invoice, deleteConfirm, deleteMutation, router]);

  const handleOpenSend = useCallback(() => {
    if (!invoice) return;
    setSendEmail(invoice.clientEmail || '');
    setSendModalVisible(true);
  }, [invoice]);

  const handleSend = useCallback(async () => {
    if (!invoice || !sendEmail.trim()) return;
    try {
      await sendMutation.mutateAsync({ id: invoice.id, recipientEmail: sendEmail.trim() });
      hapticSuccess();
      setSendModalVisible(false);
    } catch {
      // toast handled by hook
    }
  }, [invoice, sendEmail, sendMutation]);

  const handleEdit = useCallback(() => {
    // Navigate back to invoices list where editing modal exists
    router.replace('/invoices');
  }, [router]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
          <Text style={[styles.title, { color: colors.text }]}>Invoice</Text>
          <View style={{ width: 20 }} />
        </View>

        {isLoading ? (
          <InvoiceDetailSkeleton />
        ) : !invoice ? (
          <Card style={styles.errorCard}>
            <AlertTriangle size={32} color={Colors.error} strokeWidth={1.5} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Invoice not found</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              This invoice may have been deleted or the link is invalid.
            </Text>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace('/invoices')}
             
            >
              <Text style={styles.backButtonText}>View All Invoices</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            {/* Client & Status */}
            <View style={styles.topSection}>
              <Text style={[styles.clientName, { color: colors.text }]}>{invoice.clientName}</Text>
              {invoice.clientEmail ? (
                <Text style={[styles.clientEmail, { color: colors.textSecondary }]}>
                  {invoice.clientEmail}
                </Text>
              ) : null}
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[invoice.status].bg }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[invoice.status].text }]}>
                  {STATUS_LABELS[invoice.status]}
                </Text>
              </View>
            </View>

            {/* Amount Card */}
            <Card variant="elevated" style={styles.amountCard}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.amountValue, { color: Colors.accent }]}>
                {formatCurrency(invoice.amount)}
              </Text>
            </Card>

            {/* Details Card */}
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{invoice.description}</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(invoice.dueDate)}</Text>
              </View>
              {invoice.paidAt ? (
                <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Paid On</Text>
                  <Text style={[styles.detailValue, { color: Colors.success }]}>{formatDate(invoice.paidAt)}</Text>
                </View>
              ) : null}
              <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(invoice.createdAt)}</Text>
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              {invoice.status !== 'paid' && (
                <Pressable
                  style={[styles.actionButton, styles.markPaidButton, isMutating && styles.actionButtonDisabled]}
                  onPress={handleMarkPaid}
                  disabled={isMutating}
                 
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <CheckCircle size={16} color={Colors.white} strokeWidth={1.5} style={styles.actionIcon} />
                      <Text style={styles.actionButtonTextLight}>Mark as Paid</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                style={[styles.actionButton, styles.pdfButton]}
                onPress={handleDownloadPDF}
               
              >
                <FileText size={16} color={Colors.error} strokeWidth={1.5} style={styles.actionIcon} />
                <Text style={[styles.actionButtonTextDark, { color: colors.text }]}>Download PDF</Text>
              </Pressable>

              {invoice.status !== 'paid' && (
                <Pressable
                  style={[styles.actionButton, styles.sendButton, isMutating && styles.actionButtonDisabled]}
                  onPress={handleOpenSend}
                  disabled={isMutating}
                >
                  {sendMutation.isPending ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Send size={16} color={Colors.white} strokeWidth={1.5} style={styles.actionIcon} />
                      <Text style={styles.actionButtonTextLight}>Send to Client</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
              >
                <Pencil size={16} color={Colors.secondary} strokeWidth={1.5} style={styles.actionIcon} />
                <Text style={[styles.actionButtonTextDark, { color: colors.text }]}>Edit Invoice</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.deleteButton, isMutating && styles.actionButtonDisabled]}
                onPress={handleDelete}
                disabled={isMutating}
               
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={Colors.error} size="small" />
                ) : (
                  <>
                    <Trash2 size={16} color={Colors.error} strokeWidth={1.5} style={styles.actionIcon} />
                    <Text style={styles.deleteButtonText}>
                      {deleteConfirm ? 'Tap again to confirm' : 'Delete Invoice'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Send Invoice Modal */}
      <Modal
        visible={sendModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSendModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSendModalVisible(false)}>
            <Pressable style={[styles.modalCard, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Send Invoice</Text>
                <Pressable onPress={() => setSendModalVisible(false)} hitSlop={12}>
                  <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
                </Pressable>
              </View>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Recipient email</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                value={sendEmail}
                onChangeText={setSendEmail}
                placeholder="client@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.modalSendButton, (!sendEmail.trim() || sendMutation.isPending) && styles.actionButtonDisabled]}
                onPress={handleSend}
                disabled={!sendEmail.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Send</Text>
                )}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
  clientName: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  clientEmail: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    marginTop: Spacing.sm,
  },
  statusBadgeText: {
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
    marginBottom: Spacing.lg,
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
  actionButtonTextLight: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
  actionButtonTextDark: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },
  markPaidButton: {
    backgroundColor: Colors.success,
  },
  pdfButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sendButton: {
    backgroundColor: Colors.accent,
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

  // Send modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%' as unknown as number,
    maxWidth: 400,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 18,
  },
  modalLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: Spacing.md,
  },
  modalSendButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  modalSendButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    color: Colors.white,
  },
});

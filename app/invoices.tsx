import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DateInput } from '@/components/ui/DateInput';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { Skeleton, TransactionListSkeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';
import { useInvoices } from '@/lib/hooks/useApi';
import {
  useCreateInvoiceWithToast,
  useUpdateInvoiceWithToast,
  useDeleteInvoiceWithToast,
} from '@/lib/hooks/useApiWithToast';
import { formatCurrency } from '@/lib/tax-engine';
import { hapticSuccess, hapticMedium } from '@/lib/haptics';
import { downloadInvoicePDF } from '@/lib/invoiceActions';
import type { Invoice, InvoiceStatus } from '@/lib/types';

type FilterKey = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: Colors.grey[200], text: Colors.grey[700] },
  sent: { bg: '#DBEAFE', text: Colors.secondary },
  paid: { bg: '#D1FAE5', text: Colors.success },
  overdue: { bg: '#FEE2E2', text: Colors.error },
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Due ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// --- Skeleton for invoices screen ---
function InvoicesSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.md }}>
      {/* Summary stats skeleton */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[skeletonCardStyle, { backgroundColor: colors.surface, flex: 1 }]}>
            <Skeleton width={70} height={10} />
            <Skeleton width={90} height={22} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
      {/* Invoice list skeleton */}
      <TransactionListSkeleton rows={4} />
    </View>
  );
}

const skeletonCardStyle: Record<string, unknown> = {
  borderRadius: BorderRadius.card,
  padding: Spacing.md,
};

export default function InvoicesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<InvoiceStatus>('draft');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Search & date range filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setDateRange({ from, to });
  }, []);

  // API
  const queryStatus = activeFilter === 'all' ? undefined : activeFilter;
  const { data, isLoading, refetch, isRefetching } = useInvoices(queryStatus);
  const createMutation = useCreateInvoiceWithToast();
  const updateMutation = useUpdateInvoiceWithToast();
  const deleteMutation = useDeleteInvoiceWithToast();

  // All invoices (unfiltered) for stats — always fetch all
  const { data: allData } = useInvoices(undefined);
  const allInvoices = allData?.invoices ?? [];

  const invoices = data?.invoices ?? [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesClient = inv.clientName.toLowerCase().includes(q);
        const matchesDesc = inv.description.toLowerCase().includes(q);
        if (!matchesClient && !matchesDesc) return false;
      }
      if (dateRange.from) {
        if (inv.dueDate < dateRange.from) return false;
      }
      if (dateRange.to) {
        if (inv.dueDate > dateRange.to) return false;
      }
      return true;
    });
  }, [invoices, searchQuery, dateRange]);

  // Summary stats
  const totalOutstanding = useMemo(
    () => allInvoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.amount, 0),
    [allInvoices],
  );

  const totalPaidThisMonth = useMemo(
    () => allInvoices
      .filter((inv) => inv.status === 'paid' && inv.paidAt && isCurrentMonth(inv.paidAt))
      .reduce((sum, inv) => sum + inv.amount, 0),
    [allInvoices],
  );

  const overdueCount = useMemo(
    () => allInvoices.filter((inv) => inv.status === 'overdue').length,
    [allInvoices],
  );

  const resetForm = useCallback(() => {
    setFormClientName('');
    setFormClientEmail('');
    setFormAmount('');
    setFormDescription('');
    setFormDueDate('');
    setFormStatus('draft');
    setTouched({});
    setDeleteConfirm(false);
    setSelectedInvoice(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormClientName(invoice.clientName);
    setFormClientEmail(invoice.clientEmail ?? '');
    setFormAmount(String(invoice.amount));
    setFormDescription(invoice.description);
    setFormDueDate(invoice.dueDate);
    setFormStatus(invoice.status);
    setTouched({});
    setDeleteConfirm(false);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Validation
  const parsedAmount = parseFloat(formAmount);
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (formClientName.trim().length < 2) e.clientName = 'Client name must be at least 2 characters';
    if (isNaN(parsedAmount) || parsedAmount <= 0) e.amount = 'Amount must be greater than 0';
    if (formDescription.trim().length < 3) e.description = 'Description must be at least 3 characters';
    if (!formDueDate.trim()) {
      e.dueDate = 'Due date is required';
    } else {
      const due = new Date(formDueDate);
      if (isNaN(due.getTime())) e.dueDate = 'Please enter a valid date';
    }
    return e;
  }, [formClientName, parsedAmount, formDescription, formDueDate]);

  const isFormValid = Object.keys(errors).length === 0;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleCreate = useCallback(async () => {
    if (!isFormValid) return;
    try {
      await createMutation.mutateAsync({
        clientName: formClientName.trim(),
        clientEmail: formClientEmail.trim() || undefined,
        amount: parsedAmount,
        description: formDescription.trim(),
        dueDate: formDueDate.trim(),
      });
      closeModal();
    } catch {
      // toast handled by hook
    }
  }, [isFormValid, createMutation, formClientName, formClientEmail, parsedAmount, formDescription, formDueDate, closeModal]);

  const handleUpdate = useCallback(async () => {
    if (!selectedInvoice || !isFormValid) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedInvoice.id,
        data: {
          clientName: formClientName.trim(),
          amount: parsedAmount,
          description: formDescription.trim(),
          dueDate: formDueDate.trim(),
          status: formStatus,
        },
      });
      closeModal();
    } catch {
      // toast handled by hook
    }
  }, [selectedInvoice, isFormValid, updateMutation, formClientName, parsedAmount, formDescription, formDueDate, formStatus, closeModal]);

  const handleMarkPaid = useCallback(async () => {
    if (!selectedInvoice) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedInvoice.id,
        data: { status: 'paid' },
      });
      hapticSuccess();
      closeModal();
    } catch {
      // toast handled by hook
    }
  }, [selectedInvoice, updateMutation, closeModal]);

  const handleDelete = useCallback(async () => {
    if (!selectedInvoice) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync(selectedInvoice.id);
      hapticMedium();
      closeModal();
    } catch {
      // toast handled by hook
    }
  }, [selectedInvoice, deleteConfirm, deleteMutation, closeModal]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const isEditing = selectedInvoice !== null;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
        {/* Header row with back button */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FontAwesome name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Invoices</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => {
            const isActive = f.key === activeFilter;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search & Date Filter */}
        {!isLoading && invoices.length > 0 && (
          <SearchFilter
            searchPlaceholder="Search by client or description..."
            onSearchChange={handleSearchChange}
            onDateRangeChange={handleDateRangeChange}
            showDateFilter
          />
        )}

        {isLoading ? (
          <InvoicesSkeleton />
        ) : invoices.length === 0 && activeFilter === 'all' ? (
          <EmptyState
            icon="document-text-outline"
            title="No invoices yet"
            subtitle="Create your first invoice to start tracking payments"
            actionLabel="Create Invoice"
            onAction={openCreateModal}
          />
        ) : (
          <>
            {/* Summary stats */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Outstanding</Text>
                <Text style={[styles.statValue, { color: Colors.accent }]}>{formatCurrency(totalOutstanding)}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paid this month</Text>
                <Text style={[styles.statValue, { color: Colors.success }]}>{formatCurrency(totalPaidThisMonth)}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
                <Text style={[styles.statValue, { color: overdueCount > 0 ? Colors.error : colors.text }]}>
                  {overdueCount}
                </Text>
              </Card>
            </View>

            {/* Invoice list */}
            {filteredInvoices.length === 0 ? (
              <Card style={styles.emptyFilterCard}>
                <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]}>
                  {searchQuery || dateRange.from || dateRange.to
                    ? 'No invoices match your filters.'
                    : `No ${activeFilter} invoices found.`}
                </Text>
              </Card>
            ) : (
              filteredInvoices.map((invoice) => {
                const statusColor = STATUS_COLORS[invoice.status];
                const isOverdue = invoice.status === 'overdue';
                return (
                  <TouchableOpacity
                    key={invoice.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/invoice/${invoice.id}`)}
                  >
                    <Card
                      style={[
                        styles.invoiceCard,
                        isOverdue && styles.invoiceCardOverdue,
                      ]}
                    >
                      <View style={styles.invoiceTopRow}>
                        <View style={styles.invoiceLeft}>
                          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
                            {invoice.clientName}
                          </Text>
                          <Text style={[styles.invoiceDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                            {invoice.description}
                          </Text>
                        </View>
                        <View style={styles.invoiceRight}>
                          <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                            {formatCurrency(invoice.amount)}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
                              {STATUS_LABELS[invoice.status]}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.invoiceBottomRow}>
                        <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                          {formatDueDate(invoice.dueDate)}
                        </Text>
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={(e) => {
                            e.stopPropagation();
                            downloadInvoicePDF(invoice);
                          }}
                          activeOpacity={0.6}
                          style={styles.pdfButton}
                        >
                          <FontAwesome name="file-pdf-o" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* FAB — Create Invoice */}
      {!isLoading && (
        <TouchableOpacity
          style={[styles.fab, Shadows.medium]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Create / Edit Invoice Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isEditing ? 'Edit Invoice' : 'Create Invoice'}
                </Text>
                <TouchableOpacity
                  onPress={closeModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <FontAwesome name="times" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Client Name */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Client name</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: touched.clientName && errors.clientName ? Colors.error : colors.border }]}
                placeholder="e.g. Acme Ltd"
                placeholderTextColor={colors.textSecondary}
                value={formClientName}
                onChangeText={setFormClientName}
                onBlur={() => markTouched('clientName')}
              />
              {touched.clientName && errors.clientName ? (
                <Text style={styles.fieldError}>{errors.clientName}</Text>
              ) : null}

              {/* Client Email */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Client email (optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="client@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formClientEmail}
                onChangeText={setFormClientEmail}
              />

              {/* Amount */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: touched.amount && errors.amount ? Colors.error : colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={formAmount}
                onChangeText={setFormAmount}
                onBlur={() => markTouched('amount')}
              />
              {touched.amount && errors.amount ? (
                <Text style={styles.fieldError}>{errors.amount}</Text>
              ) : null}

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline, { color: colors.text, backgroundColor: colors.background, borderColor: touched.description && errors.description ? Colors.error : colors.border }]}
                placeholder="What is this invoice for?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={formDescription}
                onChangeText={setFormDescription}
                onBlur={() => markTouched('description')}
              />
              {touched.description && errors.description ? (
                <Text style={styles.fieldError}>{errors.description}</Text>
              ) : null}

              {/* Due Date */}
              <DateInput
                label="Due date"
                value={formDueDate}
                onChange={(date) => {
                  setFormDueDate(date);
                  markTouched('dueDate');
                }}
                minDate={isEditing ? undefined : todayStr}
                error={touched.dueDate ? errors.dueDate : undefined}
              />

              {/* Status picker (edit mode only) */}
              {isEditing && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={styles.statusPickerRow}>
                    {(['draft', 'sent', 'paid'] as InvoiceStatus[]).map((s) => {
                      const isActive = formStatus === s;
                      const sc = STATUS_COLORS[s];
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusPickerBtn,
                            { borderColor: isActive ? sc.text : colors.border },
                            isActive && { backgroundColor: sc.bg },
                          ]}
                          onPress={() => setFormStatus(s)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.statusPickerText,
                              { color: isActive ? sc.text : colors.textSecondary },
                            ]}
                          >
                            {STATUS_LABELS[s]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Mark as Paid button (edit mode, not already paid) */}
              {isEditing && selectedInvoice?.status !== 'paid' && (
                <TouchableOpacity
                  style={[styles.markPaidButton, updateMutation.isPending && styles.submitButtonDisabled]}
                  onPress={handleMarkPaid}
                  disabled={isMutating}
                  activeOpacity={0.8}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <FontAwesome name="check-circle" size={16} color={Colors.white} style={{ marginRight: 8 }} />
                      <Text style={styles.markPaidText}>Mark as Paid</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Save / Create button */}
              <TouchableOpacity
                style={[styles.submitButton, (!isFormValid || isMutating) && styles.submitButtonDisabled]}
                onPress={isEditing ? handleUpdate : handleCreate}
                disabled={!isFormValid || isMutating}
                activeOpacity={0.8}
              >
                {(isEditing ? updateMutation.isPending : createMutation.isPending) ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Save Changes' : 'Create Invoice'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete button (edit mode only) */}
              {isEditing && (
                <TouchableOpacity
                  style={[styles.deleteButton, deleteMutation.isPending && styles.submitButtonDisabled]}
                  onPress={handleDelete}
                  disabled={isMutating}
                  activeOpacity={0.8}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator color={Colors.error} size="small" />
                  ) : (
                    <Text style={styles.deleteButtonText}>
                      {deleteConfirm ? 'Tap again to confirm delete' : 'Delete Invoice'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
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
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },

  // Filter pills
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.grey[100],
    borderWidth: 1,
    borderColor: Colors.grey[200],
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.grey[600],
  },
  filterPillTextActive: {
    color: Colors.white,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
  },

  // Invoice card
  invoiceCard: {
    marginBottom: Spacing.sm,
  },
  invoiceCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  invoiceLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  invoiceDesc: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  invoiceAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  invoiceBottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  dueDate: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },
  pdfButton: {
    padding: 4,
  },

  // Empty filter state
  emptyFilterCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyFilterText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },

  // Modal
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
  modalTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  fieldLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  modalInput: {
    fontFamily: 'Manrope_400Regular',
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
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginBottom: Spacing.xs,
    marginTop: -2,
  },

  // Status picker
  statusPickerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusPickerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  statusPickerText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },

  // Mark as Paid
  markPaidButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  markPaidText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: Colors.white,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: Colors.white,
  },

  // Delete
  deleteButton: {
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: Colors.error,
  },
});

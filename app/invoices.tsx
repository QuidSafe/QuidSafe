import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, FileText, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateInvoiceModal } from '@/components/ui/CreateInvoiceModal';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { Skeleton, TransactionListSkeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTheme } from '@/lib/ThemeContext';
import { useInvoices } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';
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
  const [createModalVisible, setCreateModalVisible] = useState(false);

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

  // All invoices (unfiltered) for stats - always fetch all
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
        {/* Header row with back button */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.5} />
          </Pressable>
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
              <Pressable
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
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
            icon={FileText}
            title="No invoices yet"
            subtitle="Create your first invoice to start tracking payments"
            actionLabel="Create Invoice"
            onAction={() => setCreateModalVisible(true)}
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
              filteredInvoices.map((invoice: Invoice) => {
                const statusColor = STATUS_COLORS[invoice.status];
                const isOverdue = invoice.status === 'overdue';
                return (
                  <Pressable
                    key={invoice.id}
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
                        <View style={styles.rowActions}>
                          {invoice.status === 'draft' && (
                            <Pressable
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              onPress={(e) => {
                                e.stopPropagation();
                                router.push(`/invoice/${invoice.id}`);
                              }}
                              style={styles.pdfButton}
                            >
                              <Send size={16} color={Colors.accent} strokeWidth={1.5} />
                            </Pressable>
                          )}
                          <Pressable
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={(e) => {
                              e.stopPropagation();
                              downloadInvoicePDF(invoice);
                            }}
                            style={styles.pdfButton}
                          >
                            <FileText size={16} color={Colors.error} strokeWidth={1.5} />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* FAB - Create Invoice */}
      {!isLoading && (
        <Pressable
          style={[styles.fab, Shadows.medium]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={20} color={Colors.white} strokeWidth={1.5} />
        </Pressable>
      )}

      {/* Create Invoice Modal - shared component */}
      <CreateInvoiceModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => setCreateModalVisible(false)}
      />
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
    fontFamily: Fonts.lexend.semiBold,
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
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    color: '#666666',
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
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: Fonts.mono.semiBold,
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
    marginBottom: 4,
  },
  invoiceDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },
  invoiceAmount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 18,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },
  invoiceBottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  dueDate: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
  },
  rowActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
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
    fontFamily: Fonts.sourceSans.regular,
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
});

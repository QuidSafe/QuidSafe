import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Card } from '@/components/ui/Card';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import {
  useDashboard,
  useBankConnections,
  useTransactions,
  useInvoices,
  useBillingStatus,
  useMtdObligations,
  useSyncBank,
} from '@/lib/hooks/useApi';
import { useTheme } from '@/lib/ThemeContext';
import { formatCurrency } from '@/lib/tax-engine';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

// -------- Helpers --------

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'Just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getSyncHealthColor(lastSyncedAt: string | undefined): string {
  if (!lastSyncedAt) return Colors.error;
  const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 24) return Colors.success;
  if (hours < 168) return Colors.warning;
  return Colors.error;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// -------- Sub-components --------

function SectionTitle({ title, colors }: { title: string; colors: { text: string } }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.goldDot} />
      <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

function StatusDot({ color }: { color: string }) {
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

function StatRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string };
  valueColor?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor ?? colors.text }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function CountBadge({ count, color, bg }: { count: number; color: string; bg: string }) {
  return (
    <View style={[styles.countBadge, { backgroundColor: bg }]}>
      <Text style={[styles.countBadgeText, { color }]}>{count}</Text>
    </View>
  );
}

function ProgressBar({
  progress,
  color,
  bgColor,
}: {
  progress: number;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.progressBar, { backgroundColor: bgColor }]}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// -------- Toggle --------

function Toggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2A2A2A', Colors.success],
  });

  const knobTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[toggleStyles.track, { backgroundColor: trackBg }]}>
        <Animated.View
          style={[toggleStyles.knob, { transform: [{ translateX: knobTranslate }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
});

// -------- Main Screen --------

export default function StatusScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  // Data hooks
  const dashboard = useDashboard();
  const bankConnections = useBankConnections();
  const transactions = useTransactions({ limit: 10000 });
  const invoices = useInvoices();
  const billing = useBillingStatus();
  const mtd = useMtdObligations();
  const syncBank = useSyncBank();

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API health
  const [apiPing, setApiPing] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<'connected' | 'error' | 'checking'>('checking');

  const refreshAll = useCallback(() => {
    dashboard.refetch();
    bankConnections.refetch();
    transactions.refetch();
    invoices.refetch();
    billing.refetch();
    mtd.refetch();
    setLastRefreshed(new Date());
    pingApi();
  }, [dashboard, bankConnections, transactions, invoices, billing, mtd]);

  const pingApi = useCallback(async () => {
    setApiStatus('checking');
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/health`);
      const elapsed = Date.now() - start;
      if (res.ok) {
        setApiPing(elapsed);
        setApiStatus('connected');
      } else {
        setApiPing(elapsed);
        setApiStatus('error');
      }
    } catch {
      setApiPing(null);
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    pingApi();
  }, [pingApi]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshAll();
      }, 30_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshAll]);

  const isRefetching =
    dashboard.isRefetching ||
    bankConnections.isRefetching ||
    transactions.isRefetching ||
    invoices.isRefetching;

  // Derived data
  const tax = dashboard.data?.tax;
  const connections = bankConnections.data?.connections ?? [];
  const txns = transactions.data?.transactions ?? [];
  const txnTotal = transactions.data?.total ?? txns.length;
  const allInvoices = invoices.data?.invoices ?? [];

  // Transaction stats
  const categorised = txns.filter((t) => t.aiCategory != null || t.userOverride).length;
  const uncategorised = txnTotal - categorised;
  const categorisedPct = txnTotal > 0 ? Math.round((categorised / txnTotal) * 100) : 0;
  const incomeCount = txns.filter((t) => t.aiCategory === 'income' || t.isIncome).length;
  const businessCount = txns.filter((t) => t.aiCategory === 'business_expense').length;
  const personalCount = txns.filter((t) => t.aiCategory === 'personal').length;
  const incomePct = txnTotal > 0 ? Math.round((incomeCount / txnTotal) * 100) : 0;
  const businessPct = txnTotal > 0 ? Math.round((businessCount / txnTotal) * 100) : 0;
  const personalPct = txnTotal > 0 ? Math.round((personalCount / txnTotal) * 100) : 0;
  const lastTxnDate =
    txns.length > 0
      ? [...txns].sort(
          (a, b) =>
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
        )[0]?.transactionDate
      : null;

  // Invoice stats
  const draftInvoices = allInvoices.filter((i) => i.status === 'draft');
  const sentInvoices = allInvoices.filter((i) => i.status === 'sent');
  const paidInvoices = allInvoices.filter((i) => i.status === 'paid');
  const overdueInvoices = allInvoices.filter((i) => i.status === 'overdue');
  const totalOutstanding = [...sentInvoices, ...overdueInvoices].reduce(
    (s, i) => s + i.amount,
    0,
  );
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = paidInvoices
    .filter((i) => i.paidAt && new Date(i.paidAt) >= startOfMonth)
    .reduce((s, i) => s + i.amount, 0);

  // Billing
  const billingData = billing.data;
  const subTier = billingData?.plan === 'pro_monthly' || billingData?.plan === 'pro_annual' ? 'Pro' : 'Trial';
  const subStatus = billingData?.status ?? 'active';
  const trialEndsAt = billingData?.trialEndsAt;
  const trialDaysRemaining =
    trialEndsAt && subStatus === 'trialing'
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  // MTD
  const mtdSubmissions = mtd.data?.submissions ?? [];
  const mtdConnected = mtdSubmissions.length > 0 || (mtd.data?.obligations && Array.isArray(mtd.data.obligations) && mtd.data.obligations.length > 0);

  // App info
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? 'Unknown';
  const buildType = __DEV__ ? 'Development' : 'Production';
  const platform =
    Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iOS' : 'Android';

  const statusBadgeConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: Colors.success, bg: 'rgba(0,200,83,0.1)', label: 'Active' };
      case 'trialing':
        return { color: Colors.accent, bg: 'rgba(202,138,4,0.1)', label: 'Trialing' };
      case 'past_due':
        return { color: Colors.error, bg: 'rgba(220,38,38,0.1)', label: 'Past Due' };
      case 'cancelled':
        return { color: '#666666', bg: '#2A2A2A', label: 'Cancelled' };
      case 'requires_setup':
        return { color: Colors.accent, bg: 'rgba(202,138,4,0.1)', label: 'Not Started' };
      default:
        return { color: '#666666', bg: '#2A2A2A', label: 'Unknown' };
    }
  };

  const subBadge = statusBadgeConfig(subStatus);

  // ── Staggered entrance animations ──
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;
  // 8 sections: account, financial, banks, transactions, invoices, mtd, api, app
  const sectionAnims = useRef(
    Array.from({ length: 8 }, () => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(22),
    })),
  ).current;

  useEffect(() => {
    const fadeSlide = (fade: Animated.Value, slide: Animated.Value, duration: number) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration, useNativeDriver: true }),
      ]);

    // Header — immediate
    fadeSlide(headerFade, headerSlide, 300).start();

    // Sections — cascading stagger starting at 150ms, 100ms apart
    sectionAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(150 + i * 100),
        fadeSlide(anim.fade, anim.slide, 380),
      ]).start();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quarterBadgeConfig = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'accepted':
        return { color: Colors.success, bg: 'rgba(0,200,83,0.1)', label: 'Submitted' };
      case 'rejected':
        return { color: Colors.error, bg: 'rgba(220,38,38,0.1)', label: 'Rejected' };
      case 'draft':
        return { color: '#666666', bg: '#2A2A2A', label: 'Pending' };
      default:
        return { color: '#666666', bg: '#2A2A2A', label: 'Pending' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refreshAll} tintColor={colors.tint} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder, ...Shadows.soft }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={16} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>System Status</Text>
            <Text style={[styles.lastRefreshed, { color: colors.textSecondary }]}>
              Last refreshed: {formatTimestamp(lastRefreshed)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Toggle value={autoRefresh} onValueChange={setAutoRefresh} />
            <Pressable
              onPress={refreshAll}
              style={[styles.refreshButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh all data"
            >
              {isRefetching ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <RefreshCw size={14} color={Colors.secondary} strokeWidth={1.5} />
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Section 1 — Account Overview */}
        <Animated.View style={{ opacity: sectionAnims[0].fade, transform: [{ translateY: sectionAnims[0].slide }] }}>
        <SectionTitle title="Account Overview" colors={colors} />
        <Card style={styles.cardPadding}>
          <StatRow label="Name" value={user?.fullName ?? '—'} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow
            label="Email"
            value={user?.primaryEmailAddress?.emailAddress ?? '—'}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Subscription</Text>
            <View style={styles.rowEnd}>
              <Text style={[styles.statValue, { color: colors.text, marginRight: 8 }]}>
                {subTier}
              </Text>
              <StatusBadge label={subBadge.label} color={subBadge.color} bg={subBadge.bg} />
            </View>
          </View>
          {trialDaysRemaining !== null && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Trial days remaining"
                value={`${trialDaysRemaining} days`}
                colors={colors}
                valueColor={trialDaysRemaining <= 3 ? Colors.error : Colors.accent}
              />
            </>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow
            label="Account created"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => router.push('/billing')}
            style={styles.linkRow}
            accessibilityRole="link"
            accessibilityLabel="Manage Plan"
          >
            <Text style={[styles.linkText, { color: Colors.secondary }]}>Manage Plan</Text>
            <ChevronRight size={10} color={Colors.secondary} strokeWidth={1.5} />
          </Pressable>
        </Card>
        </Animated.View>

        {/* Section 2 — Financial Summary */}
        <Animated.View style={{ opacity: sectionAnims[1].fade, transform: [{ translateY: sectionAnims[1].slide }] }}>
        <SectionTitle title="Financial Summary" colors={colors} />
        <Card style={[styles.cardPadding, styles.goldLeftBorder]}>
          {dashboard.isLoading ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <>
              <StatRow
                label="Tax year"
                value={tax?.taxYear ?? '—'}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Gross income"
                value={formatCurrency(tax?.totalIncome ?? 0)}
                colors={colors}
                valueColor={Colors.success}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Total expenses"
                value={formatCurrency(tax?.totalExpenses ?? 0)}
                colors={colors}
                valueColor={Colors.error}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Net profit"
                value={formatCurrency(tax?.netProfit ?? 0)}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Total tax owed"
                value={formatCurrency(tax?.totalTaxOwed ?? 0)}
                colors={colors}
                valueColor={Colors.accent}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Effective tax rate"
                value={`${tax?.effectiveRate ?? 0}%`}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Monthly set-aside"
                value={formatCurrency(tax?.setAsideMonthly ?? 0)}
                colors={colors}
                valueColor={Colors.accent}
              />
            </>
          )}
        </Card>
        </Animated.View>

        {/* Section 3 — Bank Connections */}
        <Animated.View style={{ opacity: sectionAnims[2].fade, transform: [{ translateY: sectionAnims[2].slide }] }}>
        <SectionTitle title="Bank Connections" colors={colors} />
        <Card style={styles.cardPadding}>
          {bankConnections.isLoading ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : connections.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No bank connections
            </Text>
          ) : (
            connections.map((conn, idx) => {
              const healthColor = getSyncHealthColor(conn.lastSyncedAt);
              const isLast = idx === connections.length - 1;
              const connTxns = txns.filter((t) => t.bankConnectionId === conn.id).length;
              return (
                <View key={conn.id}>
                  <View style={styles.bankRow}>
                    <View style={styles.bankInfo}>
                      <View style={styles.bankNameRow}>
                        <StatusDot color={healthColor} />
                        <Text style={[styles.bankName, { color: colors.text }]}>
                          {conn.bankName}
                        </Text>
                        <StatusBadge
                          label={conn.active ? 'Active' : 'Inactive'}
                          color={conn.active ? Colors.success : '#666666'}
                          bg={conn.active ? 'rgba(0,200,83,0.1)' : '#2A2A2A'}
                        />
                      </View>
                      <Text style={[styles.bankDetail, { color: colors.textSecondary }]}>
                        Last synced: {formatRelativeTime(conn.lastSyncedAt)}
                      </Text>
                      <Text style={[styles.bankDetail, { color: colors.textSecondary }]}>
                        Transactions synced: {connTxns}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => syncBank.mutate(conn.id)}
                      disabled={syncBank.isPending}
                      style={[styles.syncButton, { borderColor: Colors.secondary }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Sync ${conn.bankName}`}
                    >
                      {syncBank.isPending ? (
                        <ActivityIndicator size="small" color={Colors.secondary} />
                      ) : (
                        <Text style={styles.syncButtonText}>Sync Now</Text>
                      )}
                    </Pressable>
                  </View>
                  {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              );
            })
          )}
        </Card>
        </Animated.View>

        {/* Section 4 — Transaction Stats */}
        <Animated.View style={{ opacity: sectionAnims[3].fade, transform: [{ translateY: sectionAnims[3].slide }] }}>
        <SectionTitle title="Transaction Stats" colors={colors} />
        <Card style={styles.cardPadding}>
          {transactions.isLoading ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <>
              <StatRow
                label="Total transactions"
                value={String(txnTotal)}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.progressSection}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Categorised
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {categorised} / {txnTotal} ({categorisedPct}%)
                  </Text>
                </View>
                <ProgressBar
                  progress={categorisedPct}
                  color={Colors.success}
                  bgColor="#1A1A1A"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Uncategorised"
                value={String(uncategorised)}
                colors={colors}
                valueColor={uncategorised > 0 ? Colors.warning : Colors.success}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.categoryBreakdown}>
                <Text style={[styles.statLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                  By category
                </Text>
                <View style={styles.categoryRow}>
                  <StatusDot color={Colors.success} />
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>Income</Text>
                  <Text style={[styles.categoryValue, { color: colors.textSecondary }]}>
                    {incomeCount} ({incomePct}%)
                  </Text>
                </View>
                <View style={styles.categoryRow}>
                  <StatusDot color={Colors.secondary} />
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>Business</Text>
                  <Text style={[styles.categoryValue, { color: colors.textSecondary }]}>
                    {businessCount} ({businessPct}%)
                  </Text>
                </View>
                <View style={styles.categoryRow}>
                  <StatusDot color={'#666666'} />
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>Personal</Text>
                  <Text style={[styles.categoryValue, { color: colors.textSecondary }]}>
                    {personalCount} ({personalPct}%)
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Last transaction"
                value={
                  lastTxnDate
                    ? new Date(lastTxnDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'
                }
                colors={colors}
              />
            </>
          )}
        </Card>
        </Animated.View>

        {/* Section 5 — Invoices Overview */}
        <Animated.View style={{ opacity: sectionAnims[4].fade, transform: [{ translateY: sectionAnims[4].slide }] }}>
        <SectionTitle title="Invoices Overview" colors={colors} />
        <Card style={styles.cardPadding}>
          {invoices.isLoading ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <>
              <StatRow
                label="Total invoices"
                value={String(allInvoices.length)}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.invoiceStatusRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>By status</Text>
                <View style={styles.invoiceBadges}>
                  <View style={styles.invoiceBadgeItem}>
                    <Text style={[styles.invoiceBadgeLabel, { color: colors.textSecondary }]}>
                      Draft
                    </Text>
                    <CountBadge
                      count={draftInvoices.length}
                      color={'#666666'}
                      bg={'#2A2A2A'}
                    />
                  </View>
                  <View style={styles.invoiceBadgeItem}>
                    <Text style={[styles.invoiceBadgeLabel, { color: colors.textSecondary }]}>
                      Sent
                    </Text>
                    <CountBadge
                      count={sentInvoices.length}
                      color={Colors.secondary}
                      bg="rgba(30,58,138,0.1)"
                    />
                  </View>
                  <View style={styles.invoiceBadgeItem}>
                    <Text style={[styles.invoiceBadgeLabel, { color: colors.textSecondary }]}>
                      Paid
                    </Text>
                    <CountBadge
                      count={paidInvoices.length}
                      color={Colors.success}
                      bg="rgba(0,200,83,0.1)"
                    />
                  </View>
                  <View style={styles.invoiceBadgeItem}>
                    <Text style={[styles.invoiceBadgeLabel, { color: colors.textSecondary }]}>
                      Overdue
                    </Text>
                    <CountBadge
                      count={overdueInvoices.length}
                      color={Colors.error}
                      bg="rgba(220,38,38,0.1)"
                    />
                  </View>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Outstanding amount"
                value={formatCurrency(totalOutstanding)}
                colors={colors}
                valueColor={totalOutstanding > 0 ? Colors.warning : Colors.success}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow
                label="Paid this month"
                value={formatCurrency(paidThisMonth)}
                colors={colors}
                valueColor={Colors.success}
              />
            </>
          )}
        </Card>
        </Animated.View>

        {/* Section 6 — HMRC MTD Status */}
        <Animated.View style={{ opacity: sectionAnims[5].fade, transform: [{ translateY: sectionAnims[5].slide }] }}>
        <SectionTitle title="HMRC MTD Status" colors={colors} />
        <Card style={styles.cardPadding}>
          {mtd.isLoading ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Connection status
                </Text>
                <View style={styles.rowEnd}>
                  <StatusDot color={mtdConnected ? Colors.success : '#666666'} />
                  <Text
                    style={[
                      styles.statValue,
                      { color: mtdConnected ? Colors.success : colors.textSecondary, marginLeft: 6 },
                    ]}
                  >
                    {mtdConnected ? 'Connected' : 'Not connected'}
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text
                style={[styles.statLabel, { color: colors.textSecondary, marginBottom: 8 }]}
              >
                Quarterly submissions
              </Text>
              <View style={styles.quarterGrid}>
                {[1, 2, 3, 4].map((q) => {
                  const sub = mtdSubmissions.find((s) => s.quarter === q);
                  const badge = quarterBadgeConfig(sub?.status ?? 'pending');
                  return (
                    <View key={q} style={[styles.quarterItem, { borderColor: colors.border }]}>
                      <Text style={[styles.quarterLabel, { color: colors.text }]}>Q{q}</Text>
                      <StatusBadge label={badge.label} color={badge.color} bg={badge.bg} />
                    </View>
                  );
                })}
              </View>
              {mtdSubmissions.length > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 8 }]} />
                  <StatRow
                    label="Last submission"
                    value={
                      (() => {
                        const submitted = mtdSubmissions
                          .filter((s) => s.status === 'submitted' || s.status === 'accepted');
                        if (submitted.length === 0) return '—';
                        return `Q${submitted[submitted.length - 1]?.quarter ?? '?'}`;
                      })()
                    }
                    colors={colors}
                  />
                </>
              )}
            </>
          )}
        </Card>
        </Animated.View>

        {/* Section 7 — API Health */}
        <Animated.View style={{ opacity: sectionAnims[6].fade, transform: [{ translateY: sectionAnims[6].slide }] }}>
        <SectionTitle title="API Health" colors={colors} />
        <Card style={styles.cardPadding}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.rowEnd}>
              <StatusDot
                color={
                  apiStatus === 'connected'
                    ? Colors.success
                    : apiStatus === 'checking'
                      ? Colors.warning
                      : Colors.error
                }
              />
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      apiStatus === 'connected'
                        ? Colors.success
                        : apiStatus === 'checking'
                          ? Colors.warning
                          : Colors.error,
                    marginLeft: 6,
                  },
                ]}
              >
                {apiStatus === 'connected'
                  ? 'Connected'
                  : apiStatus === 'checking'
                    ? 'Checking...'
                    : 'Error'}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow
            label="Response time"
            value={apiPing !== null ? `${apiPing}ms` : '—'}
            colors={colors}
            valueColor={
              apiPing !== null
                ? apiPing < 200
                  ? Colors.success
                  : apiPing < 1000
                    ? Colors.warning
                    : Colors.error
                : undefined
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow label="API URL" value={API_BASE} colors={colors} />
        </Card>
        </Animated.View>

        {/* Section 8 — App Info */}
        <Animated.View style={{ opacity: sectionAnims[7].fade, transform: [{ translateY: sectionAnims[7].slide }] }}>
        <SectionTitle title="App Info" colors={colors} />
        <Card style={styles.cardPadding}>
          <StatRow label="App version" value={appVersion} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow label="Expo SDK" value={sdkVersion} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow label="Build type" value={buildType} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow label="Platform" value={platform} colors={colors} />
        </Card>
        </Animated.View>
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
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  pageTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  lastRefreshed: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section titles
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  sectionTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Card padding
  cardPadding: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // Stat rows
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
  },
  statValue: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Divider
  divider: {
    height: 1,
  },

  // Status dot
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10.5,
  },

  // Count badge
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 11,
  },

  // Progress bar
  progressSection: {
    paddingVertical: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Category breakdown
  categoryBreakdown: {
    paddingVertical: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categoryLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    flex: 1,
  },
  categoryValue: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },

  // Bank connections
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
  },
  bankInfo: {
    flex: 1,
    gap: 2,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bankName: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  bankDetail: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    marginLeft: 16,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  syncButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
    color: Colors.secondary,
  },

  // Invoices
  invoiceStatusRow: {
    paddingVertical: Spacing.sm,
  },
  invoiceBadges: {
    flexDirection: 'row',
    gap: Spacing.sm + 4,
    marginTop: Spacing.sm,
  },
  invoiceBadgeItem: {
    alignItems: 'center',
    gap: 4,
  },
  invoiceBadgeLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10,
  },

  // MTD quarters
  quarterGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quarterItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  quarterLabel: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 14,
  },

  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  linkText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },

  // Empty text
  emptyText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // Gold accent left border for key sections
  goldLeftBorder: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
});

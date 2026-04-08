import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Landmark, CheckCircle, Check, X, ArrowDown, ArrowUp, PoundSterling, Link, Send, Scale } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useMtdObligations, useSubmitQuarterly, useQuarterlyBreakdown } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';
import { useTheme } from '@/lib/ThemeContext';
import type { QuarterInfo } from '@/lib/types';

// ─── Quarter status helpers ──────────────────────────────

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

const QUARTER_DATE_RANGES: Record<number, string> = {
  1: '6 Apr - 5 Jul',
  2: '6 Jul - 5 Oct',
  3: '6 Oct - 5 Jan',
  4: '6 Jan - 5 Apr',
};

type QuarterStatus = 'submitted' | 'due' | 'upcoming' | 'overdue';

function getStatusColor(status: QuarterStatus): string {
  switch (status) {
    case 'submitted':
      return Colors.success;
    case 'due':
      return Colors.accent;
    case 'upcoming':
      return '#666666';
    case 'overdue':
      return Colors.error;
  }
}

function getStatusLabel(status: QuarterStatus): string {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'due':
      return 'Due';
    case 'upcoming':
      return 'Upcoming';
    case 'overdue':
      return 'Overdue';
  }
}

function deriveQuarterStatus(
  quarterNum: number,
  currentQuarter: number,
  submissions: { quarter: number; status: string; hmrc_receipt_id: string | null }[],
): QuarterStatus {
  const sub = submissions.find((s) => s.quarter === quarterNum);
  if (sub && (sub.status === 'accepted' || sub.status === 'submitted')) return 'submitted';
  if (quarterNum < currentQuarter) return 'overdue';
  if (quarterNum === currentQuarter) return 'due';
  return 'upcoming';
}

// ─── Main Screen ──────────────────────────────────────────

export default function MTDScreen() {
  const { colors } = useTheme();
  const obligations = useMtdObligations();
  const quarters = useQuarterlyBreakdown();
  const submitMutation = useSubmitQuarterly();

  const [isConnectingHmrc, setIsConnectingHmrc] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  // Determine connection status from obligations data
  const isConnected = !obligations.isError && obligations.data != null;
  const submissions = obligations.data?.submissions ?? [];

  // Determine current quarter from quarterly breakdown
  const currentQuarter = quarters.data?.quarters
    ? (() => {
        const now = new Date();
        const month = now.getMonth() + 1;
        // UK tax year quarters: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
        if (month >= 4 && month <= 6) return 1;
        if (month >= 7 && month <= 9) return 2;
        if (month >= 10 && month <= 12) return 3;
        return 4;
      })()
    : 1;

  const taxYear = quarters.data?.taxYear ?? '2025/26';

  // Current quarter financials from breakdown data
  const currentQuarterData = quarters.data?.quarters?.find(
    (q) => q.quarter === currentQuarter,
  );

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!obligations.isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [obligations.isLoading, fadeAnim, slideAnim]);

  // Success animation
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (successReceipt) {
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      successScale.setValue(0);
      successOpacity.setValue(0);
    }
  }, [successReceipt, successScale, successOpacity]);

  const handleConnectHmrc = async () => {
    if (isConnectingHmrc) return;
    setIsConnectingHmrc(true);
    try {
      const { url } = await api.getHmrcAuthUrl();
      await WebBrowser.openBrowserAsync(url);
      obligations.refetch();
    } catch {
      Alert.alert('Connection Error', 'Could not connect to HMRC. Please try again.');
    } finally {
      setIsConnectingHmrc(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit to HMRC',
      `Are you sure you want to submit your Q${currentQuarter} update to HMRC? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            try {
              const result = await submitMutation.mutateAsync({
                taxYear,
                quarter: currentQuarter,
              });
              setSuccessReceipt(result.hmrcReceiptId);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Submission failed';
              Alert.alert('Submission Failed', message);
            }
          },
        },
      ],
    );
  };

  const handleRefresh = useCallback(() => {
    obligations.refetch();
    quarters.refetch();
  }, [obligations, quarters]);

  const isRefreshing = obligations.isRefetching || quarters.isRefetching;
  const isLoading = obligations.isLoading || quarters.isLoading;

  // Build quarter statuses for timeline
  const quarterStatuses: { quarter: number; status: QuarterStatus }[] = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    status: deriveQuarterStatus(q, currentQuarter, submissions),
  }));

  // Past submissions for history section
  const pastSubmissions = submissions.filter(
    (s) => s.status === 'accepted' || s.status === 'submitted' || s.status === 'rejected',
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Making Tax Digital',
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
            />
          }
        >
          {/* Header */}
          <Animated.View
            style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Making Tax Digital</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Submit quarterly updates to HMRC
            </Text>
          </Animated.View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading MTD data...
              </Text>
            </View>
          ) : !isConnected ? (
            /* ─── Empty / Not Connected State ─────────────── */
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Card variant="elevated" style={styles.connectCard}>
                <View style={styles.connectIconContainer}>
                  <View
                    style={[
                      styles.connectIconCircle,
                      { backgroundColor: 'rgba(0,102,255,0.2)' },
                    ]}
                  >
                    <Landmark size={28} color={Colors.secondary} strokeWidth={1.5} />
                  </View>
                </View>
                <Text style={[styles.connectTitle, { color: colors.text }]}>
                  What is Making Tax Digital?
                </Text>
                <Text style={[styles.connectDescription, { color: colors.textSecondary }]}>
                  Making Tax Digital (MTD) is HMRC&apos;s initiative requiring sole traders to submit
                  quarterly income and expense updates digitally. From April 2026, this applies to
                  businesses earning over the VAT threshold.
                </Text>
                <View style={styles.connectBenefits}>
                  {[
                    'Submit quarterly updates directly from QuidSafe',
                    'Automatic income and expense calculations',
                    'HMRC receipt confirmation for every submission',
                    'Never miss a filing deadline',
                  ].map((benefit) => (
                    <View key={benefit} style={styles.benefitRow}>
                      <CheckCircle size={14} color={Colors.success} strokeWidth={1.5} />
                      <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.connectButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleConnectHmrc}
                  disabled={isConnectingHmrc}
                  accessibilityRole="button"
                  accessibilityLabel="Connect to HMRC"
                >
                  {isConnectingHmrc ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Link size={16} color={Colors.white} strokeWidth={1.5} />
                      <Text style={styles.connectButtonText}>Connect to HMRC</Text>
                    </>
                  )}
                </Pressable>
              </Card>
            </Animated.View>
          ) : (
            /* ─── Connected State ─────────────────────────── */
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Connection Badge */}
              <View style={styles.connectionBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected to HMRC</Text>
              </View>

              {/* ─── Quarter Timeline ───────────────────────── */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  {taxYear} Quarters
                </Text>
              </View>

              <Card variant="glass" style={styles.timelineCard}>
                <View style={styles.timelineRow}>
                  {quarterStatuses.map((qs, index) => {
                    const isActive = qs.quarter === currentQuarter;
                    const statusColor = getStatusColor(qs.status);
                    const isLast = index === 3;

                    return (
                      <View key={qs.quarter} style={styles.timelineItem}>
                        {/* Quarter card */}
                        <View
                          style={[
                            styles.quarterCard,
                            {
                              backgroundColor: isActive
                                ? 'rgba(0,102,255,0.15)'
                                : 'rgba(255,255,255,0.04)',
                              borderColor: isActive
                                ? Colors.secondary
                                : 'rgba(255,255,255,0.08)',
                              borderWidth: isActive ? 2 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quarterLabel,
                              {
                                color: isActive ? Colors.secondary : colors.text,
                                fontFamily: isActive ? Fonts.sourceSans.semiBold : Fonts.sourceSans.semiBold,
                              },
                            ]}
                          >
                            {QUARTER_LABELS[qs.quarter - 1]}
                          </Text>
                          <Text style={[styles.quarterDates, { color: colors.textSecondary }]}>
                            {QUARTER_DATE_RANGES[qs.quarter]}
                          </Text>

                          {/* Status badge */}
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: `${statusColor}18` },
                            ]}
                          >
                            <View
                              style={[styles.statusDot, { backgroundColor: statusColor }]}
                            />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                              {getStatusLabel(qs.status)}
                            </Text>
                          </View>
                        </View>

                        {/* Connecting line */}
                        {!isLast && (
                          <View style={styles.connectorContainer}>
                            <View
                              style={[
                                styles.connectorLine,
                                {
                                  backgroundColor:
                                    qs.status === 'submitted'
                                      ? Colors.success
                                      : '#2A2A2A',
                                },
                              ]}
                            />
                            {qs.status === 'submitted' && (
                              <View style={styles.connectorCheck}>
                                <Check size={8} color={Colors.white} strokeWidth={2} />
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </Card>

              {/* ─── Current Quarter Detail ─────────────────── */}
              {successReceipt ? (
                /* Success state */
                <Animated.View
                  style={[
                    styles.successCard,
                    {
                      opacity: successOpacity,
                      transform: [{ scale: successScale }],
                    },
                  ]}
                >
                  <Card variant="elevated" style={styles.successInner}>
                    <View
                      style={[
                        styles.successIconCircle,
                        { backgroundColor: 'rgba(0,200,83,0.12)' },
                      ]}
                    >
                      <CheckCircle size={40} color={Colors.success} strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>
                      Submission Accepted
                    </Text>
                    <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                      Q{currentQuarter} has been submitted to HMRC
                    </Text>
                    <View
                      style={[
                        styles.receiptBox,
                        {
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        },
                      ]}
                    >
                      <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                        HMRC Receipt ID
                      </Text>
                      <Text style={[styles.receiptId, { color: colors.text }]}>
                        {successReceipt}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dismissButton,
                        { backgroundColor: '#0A0A0A' },
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        setSuccessReceipt(null);
                        obligations.refetch();
                        quarters.refetch();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss success message"
                    >
                      <Text style={[styles.dismissButtonText, { color: colors.text }]}>Done</Text>
                    </Pressable>
                  </Card>
                </Animated.View>
              ) : (
                /* Detail card */
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      Q{currentQuarter} Details
                    </Text>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        {
                          backgroundColor: `${getStatusColor(
                            deriveQuarterStatus(currentQuarter, currentQuarter, submissions),
                          )}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTextSmall,
                          {
                            color: getStatusColor(
                              deriveQuarterStatus(currentQuarter, currentQuarter, submissions),
                            ),
                          },
                        ]}
                      >
                        {getStatusLabel(
                          deriveQuarterStatus(currentQuarter, currentQuarter, submissions),
                        )}
                      </Text>
                    </View>
                  </View>

                  <Card variant="elevated">
                    {/* Financial summary rows */}
                    <View style={styles.detailRows}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <View
                            style={[
                              styles.detailIcon,
                              { backgroundColor: 'rgba(0,200,83,0.1)' },
                            ]}
                          >
                            <ArrowDown size={12} color={Colors.success} strokeWidth={1.5} />
                          </View>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            Income
                          </Text>
                        </View>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          {formatCurrency(currentQuarterData?.income ?? 0)}
                        </Text>
                      </View>

                      <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <View
                            style={[
                              styles.detailIcon,
                              { backgroundColor: 'rgba(255,59,48,0.1)' },
                            ]}
                          >
                            <ArrowUp size={12} color={Colors.error} strokeWidth={1.5} />
                          </View>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            Expenses
                          </Text>
                        </View>
                        <Text style={[styles.detailValue, { color: Colors.error }]}>
                          -{formatCurrency(currentQuarterData?.expenses ?? 0)}
                        </Text>
                      </View>

                      <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <View
                            style={[
                              styles.detailIcon,
                              { backgroundColor: 'rgba(255,255,255,0.06)' },
                            ]}
                          >
                            <Scale size={11} color={colors.text} strokeWidth={1.5} />
                          </View>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            Net Profit
                          </Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {formatCurrency(
                            (currentQuarterData?.income ?? 0) -
                              (currentQuarterData?.expenses ?? 0),
                          )}
                        </Text>
                      </View>

                      <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <View
                            style={[
                              styles.detailIcon,
                              { backgroundColor: 'rgba(0,102,255,0.1)' },
                            ]}
                          >
                            <PoundSterling size={12} color={Colors.accent} strokeWidth={1.5} />
                          </View>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            Tax Liability
                          </Text>
                        </View>
                        <Text style={[styles.detailValue, { color: Colors.accent }]}>
                          {formatCurrency(currentQuarterData?.tax ?? 0)}
                        </Text>
                      </View>
                    </View>

                    {/* Submit button */}
                    {deriveQuarterStatus(currentQuarter, currentQuarter, submissions) !== 'submitted' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.submitButton,
                          pressed && styles.buttonPressed,
                          submitMutation.isPending && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={submitMutation.isPending}
                        accessibilityRole="button"
                        accessibilityLabel={`Submit Q${currentQuarter} to HMRC`}
                      >
                        {submitMutation.isPending ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <>
                            <Send size={14} color={Colors.white} strokeWidth={1.5} />
                            <Text style={styles.submitButtonText}>Submit to HMRC</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </Card>
                </>
              )}

              {/* ─── Submission History ─────────────────────── */}
              {pastSubmissions.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      Submission History
                    </Text>
                  </View>

                  <Card>
                    {pastSubmissions.map((sub, index) => {
                      const isAccepted = sub.status === 'accepted' || sub.status === 'submitted';
                      const isLast = index === pastSubmissions.length - 1;
                      return (
                        <View key={`sub-${sub.quarter}`}>
                          <View style={styles.historyRow}>
                            <View style={styles.historyLeft}>
                              <View
                                style={[
                                  styles.historyIcon,
                                  {
                                    backgroundColor: isAccepted
                                      ? 'rgba(0,200,83,0.1)'
                                      : 'rgba(255,59,48,0.1)',
                                  },
                                ]}
                              >
                                {isAccepted
                                  ? <Check size={12} color={Colors.success} strokeWidth={2} />
                                  : <X size={12} color={Colors.error} strokeWidth={2} />
                                }
                              </View>
                              <View>
                                <Text style={[styles.historyQuarter, { color: colors.text }]}>
                                  Q{sub.quarter} {taxYear}
                                </Text>
                                {sub.hmrc_receipt_id && (
                                  <Text
                                    style={[
                                      styles.historyReceipt,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    {sub.hmrc_receipt_id}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View
                              style={[
                                styles.historyBadge,
                                {
                                  backgroundColor: isAccepted
                                    ? 'rgba(0,200,83,0.1)'
                                    : 'rgba(255,59,48,0.1)',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyBadgeText,
                                  {
                                    color: isAccepted ? Colors.success : Colors.error,
                                  },
                                ]}
                              >
                                {isAccepted ? 'Accepted' : 'Rejected'}
                              </Text>
                            </View>
                          </View>
                          {!isLast && (
                            <View
                              style={[styles.historyDivider, { backgroundColor: colors.border }]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </Card>
                </>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },

  // Header
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },

  // Connection status badge
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0,200,83,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  connectedText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    color: Colors.success,
  },

  // Connect card (empty state)
  connectCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  connectIconContainer: {
    marginBottom: Spacing.lg,
  },
  connectIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  connectDescription: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  connectBenefits: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.sm,
  },
  benefitText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.button,
    alignSelf: 'stretch',
  },
  connectButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: Colors.white,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionHeading: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Timeline
  timelineCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quarterCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 4,
  },
  quarterLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  quarterDates: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 8.5,
    textAlign: 'center',
    lineHeight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    marginTop: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusTextSmall: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },

  // Connector between quarters
  connectorContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  connectorLine: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  connectorCheck: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail card
  detailRows: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
  },
  detailValue: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 16,
  },
  detailDivider: {
    height: 1,
    marginLeft: 44,
  },

  // Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    color: Colors.white,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  // Success state
  successCard: {
    marginTop: Spacing.sm,
  },
  successInner: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  receiptBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: Spacing.lg,
  },
  receiptLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  receiptId: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.button,
  },
  dismissButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 15,
  },

  // Submission history
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyQuarter: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  historyReceipt: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    marginTop: 1,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  historyBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 11,
  },
  historyDivider: {
    height: 1,
    marginLeft: 44,
  },
});

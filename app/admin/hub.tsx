import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, XCircle, AlertCircle, ExternalLink,
  Activity, Users, TrendingUp, PoundSterling, Zap, Database, Landmark, Receipt,
  Clock, RefreshCcw, Settings,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { TabHeader } from '@/components/ui/TabHeader';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { ENVIRONMENTS, useEnvHub, type EnvDescriptor, type EnvKey, type EnvHubResult } from '@/lib/hooks/useAdmin';
import type { AdminHubPayload, AdminHubIncident, AdminHubKpi, AdminHubFunnelStep, AdminHubJobStatus } from '@/lib/types';

function openExternal(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url).catch(() => {});
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatKpi(k: AdminHubKpi): string {
  if (k.unitPrefix === '£') return formatPence(k.value);
  const n = k.value.toLocaleString('en-GB');
  return `${k.unitPrefix ?? ''}${n}${k.unitSuffix ?? ''}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMin = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

function IncidentsPanel({ incidents }: { incidents: AdminHubIncident[] }) {
  if (incidents.length === 0) {
    return (
      <View style={[styles.incidentCalm]}>
        <CheckCircle2 size={16} color={Colors.success} strokeWidth={1.5} />
        <Text style={styles.incidentCalmText}>All systems healthy</Text>
      </View>
    );
  }
  return (
    <View style={styles.incidentsStack}>
      {incidents.map((inc, i) => {
        const color = inc.severity === 'critical' ? Colors.error : Colors.warning;
        const bg = inc.severity === 'critical' ? 'rgba(255,59,48,0.08)' : 'rgba(255,149,0,0.08)';
        return (
          <View key={i} style={[styles.incidentRow, { borderColor: color, backgroundColor: bg }]}>
            <AlertTriangle size={14} color={color} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.incidentLabel, { color }]}>{inc.label}</Text>
              <Text style={styles.incidentDetail}>{inc.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function KpiStrip({ kpis }: { kpis: AdminHubKpi[] }) {
  return (
    <View style={styles.kpiRow}>
      {kpis.map((k, i) => (
        <View key={i} style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{k.label}</Text>
          <Text style={styles.kpiValue}>{formatKpi(k)}</Text>
        </View>
      ))}
    </View>
  );
}

function Funnel({ steps }: { steps: AdminHubFunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <View style={styles.funnelStack}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].count : null;
        const dropPct = prev && prev > 0 ? Math.round((s.count / prev) * 100) : null;
        const widthPct = Math.max(4, Math.round((s.count / max) * 100));
        return (
          <View key={s.label} style={styles.funnelRow}>
            <Text style={styles.funnelLabel}>{s.label}</Text>
            <View style={styles.funnelTrack}>
              <View style={[styles.funnelFill, { width: `${widthPct}%` }]} />
              <Text style={styles.funnelCount}>{s.count.toLocaleString('en-GB')}</Text>
            </View>
            <Text style={styles.funnelPct}>{dropPct !== null ? `${dropPct}%` : ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

function JobsList({ jobs }: { jobs: AdminHubJobStatus[] }) {
  if (jobs.length === 0) {
    return <Text style={styles.mutedBody}>No cron runs recorded yet. First run will populate this list.</Text>;
  }
  return (
    <View style={{ gap: 6 }}>
      {jobs.map((j) => {
        const color = j.lastStatus === 'failed' ? Colors.error : j.lastStatus === 'running' ? Colors.warning : Colors.success;
        return (
          <View key={j.name} style={styles.jobRow}>
            <View style={[styles.jobDot, { backgroundColor: color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.jobName}>{j.name}</Text>
              <Text style={styles.jobMeta}>
                {j.lastStatus ?? 'pending'} · {relativeTime(j.lastFinishedAt ?? j.lastStartedAt)}
                {j.lastDurationMs !== null ? ` · ${(j.lastDurationMs / 1000).toFixed(1)}s` : ''}
              </Text>
              {j.lastError ? <Text style={styles.jobError}>{j.lastError}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SectionHead({ icon: Icon, title, subtitle }: {
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionIconBox}>
        <Icon size={14} color={Colors.electricBlue} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, color ? { color } : undefined]}>{value.toLocaleString('en-GB')}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

const QUICK_LINKS: { label: string; url: string }[] = [
  { label: 'Cloudflare', url: 'https://dash.cloudflare.com' },
  { label: 'Stripe',     url: 'https://dashboard.stripe.com' },
  { label: 'Clerk',      url: 'https://dashboard.clerk.com' },
  { label: 'TrueLayer',  url: 'https://console.truelayer.com' },
  { label: 'Resend',     url: 'https://resend.com/emails' },
  { label: 'HMRC',       url: 'https://developer.service.hmrc.gov.uk' },
  { label: 'Anthropic',  url: 'https://console.anthropic.com' },
  { label: 'GitHub PRs', url: 'https://github.com/QuidSafe/QuidSafe/pulls' },
];

function EnvPanel({ env, result }: { env: EnvDescriptor; result: EnvHubResult }) {
  if (result.status === 'loading') {
    return <View style={styles.centered}><ActivityIndicator size="small" color={colors.accent} /></View>;
  }
  if (result.status === 'not-admin') {
    return (
      <View style={styles.centered}>
        <AlertCircle size={24} color={Colors.warning} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Not an admin on {env.label}</Text>
        <Text style={styles.emptySub}>Add your email to ADMIN_EMAILS on this env.</Text>
      </View>
    );
  }
  if (result.status === 'unreachable') {
    return (
      <View style={styles.centered}>
        <XCircle size={24} color={Colors.error} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>{env.label} unreachable</Text>
        <Text style={styles.emptySub}>{result.message}</Text>
      </View>
    );
  }
  return <EnvContent env={env} payload={result.payload} />;
}

function EnvContent({ env, payload }: { env: EnvDescriptor; payload: AdminHubPayload }) {
  const opexTotal = payload.opex.reduce((s, o) => s + o.monthlyPence, 0);
  return (
    <ScrollView contentContainerStyle={styles.panelScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.envMeta}>
        {env.apiUrl} · updated {new Date(payload.generatedAt).toLocaleTimeString('en-GB')}
      </Text>

      <SectionHead icon={AlertTriangle} title="Incidents" subtitle={payload.incidents.length === 0 ? 'Nothing to address.' : `${payload.incidents.length} need attention`} />
      <IncidentsPanel incidents={payload.incidents} />

      <SectionHead icon={Activity} title="At a glance" />
      <KpiStrip kpis={payload.kpis} />

      <SectionHead icon={TrendingUp} title="Funnel" subtitle="Signup → onboarded → bank connected → paid" />
      <Card style={styles.cardPadding}>
        <View style={{ padding: Spacing.md }}>
          <Funnel steps={payload.funnel} />
        </View>
      </Card>

      <SectionHead icon={Users} title="Subscriptions" />
      <Card style={styles.cardPadding}>
        <View style={[styles.statRow, { padding: Spacing.md }]}>
          {payload.subsByStatus.length === 0 ? (
            <Text style={styles.mutedBody}>No subscriptions yet.</Text>
          ) : payload.subsByStatus.map((s) => (
            <StatPill
              key={s.status}
              label={s.status}
              value={s.count}
              color={s.status === 'active' ? Colors.success : s.status === 'past_due' ? Colors.warning : s.status === 'cancelled' ? Colors.error : undefined}
            />
          ))}
        </View>
      </Card>

      <SectionHead icon={Landmark} title="Bank connections" />
      <Card style={styles.cardPadding}>
        <View style={[styles.statRow, { padding: Spacing.md }]}>
          <StatPill label="active"       value={payload.bankHealth.activeCount} color={Colors.success} />
          <StatPill label="expired"      value={payload.bankHealth.expiredCount} color={payload.bankHealth.expiredCount > 0 ? Colors.error : undefined} />
          <StatPill label="never synced" value={payload.bankHealth.neverSyncedCount} />
          <StatPill label="stale 24h"    value={payload.bankHealth.stale24hCount} color={payload.bankHealth.stale24hCount > 0 ? Colors.warning : undefined} />
        </View>
      </Card>

      <SectionHead icon={Receipt} title="MTD submissions" />
      <Card style={styles.cardPadding}>
        <View style={[styles.statRow, { padding: Spacing.md }]}>
          <StatPill label="submitted" value={payload.mtdHealth.submittedCount} color={Colors.success} />
          <StatPill label="draft"     value={payload.mtdHealth.draftCount} />
          <StatPill label="rejected"  value={payload.mtdHealth.rejectedCount} color={payload.mtdHealth.rejectedCount > 0 ? Colors.error : undefined} />
        </View>
      </Card>

      <SectionHead icon={Clock} title="Scheduled jobs" subtitle="Last run of each cron phase" />
      <Card style={styles.cardPadding}>
        <View style={{ padding: Spacing.md }}>
          <JobsList jobs={payload.jobs} />
        </View>
      </Card>

      <SectionHead icon={PoundSterling} title="Monthly opex (estimate)" subtitle={`Total ~${formatPence(opexTotal)} / month`} />
      <Card style={styles.cardPadding}>
        {payload.opex.map((o, i) => (
          <View key={i} style={styles.opexRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.opexService}>{o.service}</Text>
              <Text style={styles.opexNote}>{o.note}</Text>
            </View>
            <Text style={styles.opexValue}>{formatPence(o.monthlyPence)}</Text>
          </View>
        ))}
      </Card>

      <SectionHead icon={Zap} title="Quick links" subtitle="External service dashboards" />
      <View style={styles.linksGrid}>
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.label}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
            onPress={() => openExternal(link.url)}
            accessibilityRole="link"
            accessibilityLabel={`Open ${link.label} dashboard`}
          >
            <Text style={styles.linkText}>{link.label}</Text>
            <ExternalLink size={12} color={colors.textMuted} strokeWidth={1.5} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function EnvTab({ env, active, result, onPress }: {
  env: EnvDescriptor;
  active: boolean;
  result: EnvHubResult;
  onPress: () => void;
}) {
  const color =
    result.status === 'loading' ? colors.textMuted :
    result.status === 'ok' ? Colors.success :
    result.status === 'not-admin' ? Colors.warning : Colors.error;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.tabDot, { backgroundColor: color }]} />
      <Text style={[styles.tabText, { color: active ? colors.text : colors.textSecondary }]}>
        {env.label}
      </Text>
    </Pressable>
  );
}

export default function AdminHubScreen() {
  const router = useRouter();
  const [activeEnv, setActiveEnv] = useState<EnvKey>('production');
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;

  const prod    = useEnvHub(ENVIRONMENTS[0]);
  const staging = useEnvHub(ENVIRONMENTS[1]);
  const dev     = useEnvHub(ENVIRONMENTS[2]);

  const entries: { env: EnvDescriptor; query: typeof prod }[] = [
    { env: ENVIRONMENTS[0], query: prod },
    { env: ENVIRONMENTS[1], query: staging },
    { env: ENVIRONMENTS[2], query: dev },
  ];

  const resolve = (q: typeof prod): EnvHubResult =>
    q.data ?? (q.isLoading ? { status: 'loading' } : { status: 'unreachable', message: 'No response' });

  const activeEntry = entries.find((e) => e.env.key === activeEnv)!;
  const activeResult = resolve(activeEntry.query);

  const refreshAll = () => entries.forEach((e) => e.query.refetch());
  const isAnyRefetching = entries.some((e) => e.query.isRefetching);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.maxWidth}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push('/admin/setup')}
              style={({ pressed }) => [styles.topBarLink, pressed && styles.topBarLinkPressed]}
              accessibilityRole="link"
              accessibilityLabel="Open admin setup checklist"
            >
              <Settings size={14} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.topBarLinkText}>Setup</Text>
            </Pressable>
            <Pressable
              onPress={refreshAll}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Refresh all environments"
            >
              {isAnyRefetching ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <RefreshCcw size={16} color={colors.textSecondary} strokeWidth={1.5} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.headerPadding}>
          <TabHeader title="Admin · Hub" subtitle="Business health across all environments" />
        </View>

        <View style={styles.tabsRow}>
          {entries.map(({ env, query }) => (
            <EnvTab
              key={env.key}
              env={env}
              active={activeEnv === env.key}
              result={resolve(query)}
              onPress={() => setActiveEnv(env.key)}
            />
          ))}
        </View>

        {isWide ? (
          <View style={styles.wideLayout}>
            <View style={{ flex: 1 }}>
              <EnvPanel env={activeEntry.env} result={activeResult} />
            </View>
          </View>
        ) : (
          <EnvPanel env={activeEntry.env} result={activeResult} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  maxWidth: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBarLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  topBarLinkPressed: { opacity: 0.7 },
  topBarLinkText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.3 },

  headerPadding: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },

  wideLayout: { flex: 1 },

  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { backgroundColor: colors.accentGlow, borderColor: Colors.electricBlue },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  tabText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, letterSpacing: 0.3 },

  panelScroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  envMeta: { fontFamily: Fonts.mono.regular, fontSize: 11, color: colors.textMuted },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.sm },
  sectionIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 14, color: colors.text },
  sectionSub: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  // Incidents
  incidentCalm: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,200,83,0.08)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: BorderRadius.card,
  },
  incidentCalmText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.success },
  incidentsStack: { gap: Spacing.sm },
  incidentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1, borderRadius: BorderRadius.card,
  },
  incidentLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13 },
  incidentDetail: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // KPI strip
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: {
    flexBasis: '30%', flexGrow: 1, minWidth: 130,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    gap: 4,
  },
  kpiLabel: {
    fontFamily: Fonts.sourceSans.semiBold, fontSize: 10,
    color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  kpiValue: { fontFamily: Fonts.mono.semiBold, fontSize: 20, color: colors.text, letterSpacing: -0.3 },

  // Funnel
  funnelStack: { gap: 8 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  funnelLabel: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary, width: 100 },
  funnelTrack: {
    flex: 1, height: 26,
    backgroundColor: colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    position: 'relative',
  },
  funnelFill: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: Colors.electricBlue,
    opacity: 0.18,
  },
  funnelCount: { fontFamily: Fonts.mono.semiBold, fontSize: 12, color: colors.text },
  funnelPct: { fontFamily: Fonts.mono.regular, fontSize: 11, color: colors.textMuted, width: 48, textAlign: 'right' },

  // Stat pills (subs, bank, mtd)
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statPill: {
    flexBasis: '22%', flexGrow: 1, minWidth: 100,
    gap: 2,
  },
  statPillValue: { fontFamily: Fonts.mono.semiBold, fontSize: 20, color: colors.text },
  statPillLabel: {
    fontFamily: Fonts.sourceSans.semiBold, fontSize: 10,
    color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase',
  },

  // Jobs
  jobRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 6 },
  jobDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  jobName: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.text },
  jobMeta: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  jobError: { fontFamily: Fonts.mono.regular, fontSize: 11, color: Colors.error, marginTop: 2 },

  // Opex
  opexRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  opexService: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: colors.text },
  opexNote: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  opexValue: { fontFamily: Fonts.mono.semiBold, fontSize: 13, color: colors.text },

  // Quick links
  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: BorderRadius.pill,
    flexBasis: '30%', flexGrow: 1, minWidth: 120,
    justifyContent: 'center',
  },
  linkBtnPressed: { opacity: 0.7 },
  linkText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: colors.text },

  cardPadding: { padding: 0, overflow: 'hidden' },

  // Empty states
  emptyTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 14, color: colors.text, marginTop: Spacing.sm },
  emptySub: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'center', maxWidth: 320 },
  mutedBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 12, color: colors.textMuted },
});

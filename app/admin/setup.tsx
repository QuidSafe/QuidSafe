import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Database,
  Key,
  Globe,
  GitBranch,
  RefreshCcw,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { TabHeader } from '@/components/ui/TabHeader';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import {
  ENVIRONMENTS,
  useEnvSetup,
  type EnvDescriptor,
  type EnvKey,
  type EnvSetupResult,
} from '@/lib/hooks/useAdmin';
import type {
  AdminEnvVarStatus,
  AdminMigrationStatus,
  AdminExternalServiceStatus,
} from '@/lib/types';

function openExternal(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: ok ? Colors.success + '20' : Colors.error + '20' }]}>
      {ok ? (
        <CheckCircle2 size={12} color={Colors.success} strokeWidth={2} />
      ) : (
        <XCircle size={12} color={Colors.error} strokeWidth={2} />
      )}
      <Text style={[styles.pillText, { color: ok ? Colors.success : Colors.error }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const colorFor = pct === 100 ? Colors.success : pct >= 75 ? Colors.electricBlue : pct >= 50 ? Colors.warning : Colors.error;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colorFor }]} />
    </View>
  );
}

function SectionHeading({ icon: Icon, title, sub, progress }: {
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  sub?: string;
  progress?: { value: number; total: number };
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionIconBox}>
        <Icon size={14} color={Colors.electricBlue} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {progress ? (
            <Text style={styles.sectionCount}>
              {progress.value}<Text style={styles.sectionCountSep}> / </Text>{progress.total}
            </Text>
          ) : null}
        </View>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
        {progress ? <ProgressBar value={progress.value} total={progress.total} /> : null}
      </View>
    </View>
  );
}

// Top-of-page KPI strip. Gives instant status across all three envs
// without needing to click into each tab.
function HealthSummary({ queries }: { queries: { env: EnvDescriptor; query: { data?: EnvSetupResult; isLoading: boolean } }[] }) {
  const liveResults = queries.map(({ env, query }) => ({
    env,
    result: query.data ?? (query.isLoading ? { status: 'loading' as const } : undefined),
  }));

  const healthyCount = liveResults.filter((r) => r.result?.status === 'ok').length;
  const totalEnvs = liveResults.length;

  const prodResult = liveResults.find((r) => r.env.key === 'production')?.result;
  const prodVars = prodResult?.status === 'ok'
    ? { present: prodResult.payload.envVars.filter((v) => v.present).length, total: prodResult.payload.envVars.length }
    : null;
  const prodMigrations = prodResult?.status === 'ok'
    ? { applied: prodResult.payload.migrations.totalApplied, total: prodResult.payload.migrations.totalInRepo }
    : null;

  return (
    <View style={styles.kpiRow}>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Environments healthy</Text>
        <Text style={[styles.kpiValue, { color: healthyCount === totalEnvs ? Colors.success : Colors.warning }]}>
          {healthyCount}<Text style={styles.kpiValueSub}> / {totalEnvs}</Text>
        </Text>
      </View>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Prod env vars</Text>
        <Text style={[styles.kpiValue, { color: prodVars && prodVars.present === prodVars.total ? Colors.success : Colors.warning }]}>
          {prodVars ? (
            <>
              {prodVars.present}<Text style={styles.kpiValueSub}> / {prodVars.total}</Text>
            </>
          ) : '—'}
        </Text>
      </View>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Prod migrations</Text>
        <Text style={[styles.kpiValue, { color: prodMigrations && prodMigrations.applied === prodMigrations.total ? Colors.success : Colors.warning }]}>
          {prodMigrations ? (
            <>
              {prodMigrations.applied}<Text style={styles.kpiValueSub}> / {prodMigrations.total}</Text>
            </>
          ) : '—'}
        </Text>
      </View>
    </View>
  );
}

function EnvVarRow({ row }: { row: AdminEnvVarStatus }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowKey}>{row.key}</Text>
        <Text style={styles.rowDesc}>{row.description}</Text>
        {row.preview ? <Text style={styles.rowPreview}>{row.preview}</Text> : null}
      </View>
      <StatusPill ok={row.present} label={row.present ? 'SET' : 'MISSING'} />
    </View>
  );
}

function MigrationRow({ row }: { row: AdminMigrationStatus }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowKey}>{row.filename}</Text>
        {row.appliedAt ? (
          <Text style={styles.rowDesc}>Applied {new Date(row.appliedAt).toLocaleString('en-GB')}</Text>
        ) : (
          <Text style={[styles.rowDesc, { color: Colors.warning }]}>Pending</Text>
        )}
      </View>
      <StatusPill ok={row.applied} label={row.applied ? 'APPLIED' : 'PENDING'} />
    </View>
  );
}

function ServiceRow({ row }: { row: AdminExternalServiceStatus }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => openExternal(row.dashboardUrl)}
      accessibilityRole="link"
      accessibilityLabel={`Open ${row.name} dashboard`}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowKey}>{row.name}</Text>
        <Text style={styles.rowDesc}>{row.dashboardUrl}</Text>
      </View>
      <View style={styles.rowRightStack}>
        <StatusPill ok={row.configured} label={row.configured ? 'WIRED' : 'NOT SET'} />
        <ExternalLink size={12} color={colors.textMuted} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}

function EnvTabButton({ env, active, result, onPress }: {
  env: EnvDescriptor;
  active: boolean;
  result: EnvSetupResult | undefined;
  onPress: () => void;
}) {
  const indicator = (() => {
    if (!result || result.status === 'loading') return { color: colors.textMuted, icon: ActivityIndicator };
    if (result.status === 'ok') return { color: Colors.success, icon: CheckCircle2 };
    if (result.status === 'not-admin') return { color: Colors.warning, icon: AlertCircle };
    return { color: Colors.error, icon: XCircle };
  })();
  const Icon = indicator.icon;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      {Icon === ActivityIndicator ? (
        <ActivityIndicator size="small" color={indicator.color} />
      ) : (
        <Icon size={12} color={indicator.color} strokeWidth={2} />
      )}
      <Text style={[styles.tabBtnText, { color: active ? colors.text : colors.textSecondary }]}>
        {env.label}
      </Text>
    </Pressable>
  );
}

function EnvPanel({ env, result, onRefresh, isRefreshing }: {
  env: EnvDescriptor;
  result: EnvSetupResult | undefined;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  if (!result || result.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (result.status === 'not-admin') {
    return (
      <View style={styles.centered}>
        <AlertCircle size={24} color={Colors.warning} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Not an admin on this env</Text>
        <Text style={styles.emptySub}>
          Add your email to <Text style={styles.mono}>ADMIN_EMAILS</Text> on this Worker:
        </Text>
        <Text style={[styles.mono, styles.code]}>
          npx wrangler secret put ADMIN_EMAILS --config wrangler.worker.toml --env {env.key}
        </Text>
      </View>
    );
  }

  if (result.status === 'unreachable') {
    return (
      <View style={styles.centered}>
        <XCircle size={24} color={Colors.error} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>{env.label} API unreachable</Text>
        <Text style={styles.emptySub}>{result.message}</Text>
        <Text style={styles.emptyMeta}>{env.apiUrl}</Text>
      </View>
    );
  }

  const data = result.payload;

  return (
    <ScrollView contentContainerStyle={styles.panelScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.panelHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>{env.label}</Text>
          <Text style={styles.panelSub}>
            {env.apiUrl} · updated {new Date(data.generatedAt).toLocaleTimeString('en-GB')}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel={`Refresh ${env.label}`}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <RefreshCcw size={14} color={colors.textSecondary} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <SectionHeading
        icon={Key}
        title="Environment variables"
        progress={{
          value: data.envVars.filter((v) => v.present).length,
          total: data.envVars.length,
        }}
      />
      <Card style={styles.cardPadding}>
        {data.envVars.map((v) => <EnvVarRow key={v.key} row={v} />)}
      </Card>

      <SectionHeading
        icon={Database}
        title="D1 migrations"
        progress={{
          value: data.migrations.totalApplied,
          total: data.migrations.totalInRepo,
        }}
      />
      <Card style={styles.cardPadding}>
        {data.migrations.rows.map((m) => <MigrationRow key={m.filename} row={m} />)}
      </Card>

      <SectionHeading
        icon={Globe}
        title="External services"
        progress={{
          value: data.externalServices.filter((s) => s.configured).length,
          total: data.externalServices.length,
        }}
        sub="Tap to open each dashboard"
      />
      <Card style={styles.cardPadding}>
        {data.externalServices.map((s) => <ServiceRow key={s.name} row={s} />)}
      </Card>

      <SectionHeading icon={GitBranch} title="Runtime" />
      <Card style={styles.cardPadding}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowKey}>Commit SHA</Text>
            <Text style={styles.rowDesc}>{data.runtime.commitSha ?? 'Not injected at build time'}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowKey}>App URL</Text>
            <Text style={styles.rowDesc}>{data.runtime.appUrl ?? '-'}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowKey}>TrueLayer mode</Text>
            <Text style={styles.rowDesc}>{data.runtime.sandboxBanking ? 'Sandbox' : 'Production'}</Text>
          </View>
          <StatusPill
            ok={env.key === 'production' ? !data.runtime.sandboxBanking : data.runtime.sandboxBanking}
            label={data.runtime.sandboxBanking ? 'SANDBOX' : 'LIVE'}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

export default function AdminSetupScreen() {
  const router = useRouter();
  const [activeEnv, setActiveEnv] = useState<EnvKey>('production');

  // Hooks called unconditionally in the order of ENVIRONMENTS so the
  // React-hooks rule is satisfied. All three fire in parallel on mount.
  const prodQuery = useEnvSetup(ENVIRONMENTS[0]);
  const stagingQuery = useEnvSetup(ENVIRONMENTS[1]);
  const devQuery = useEnvSetup(ENVIRONMENTS[2]);

  const envQueries = [
    { env: ENVIRONMENTS[0], query: prodQuery },
    { env: ENVIRONMENTS[1], query: stagingQuery },
    { env: ENVIRONMENTS[2], query: devQuery },
  ];
  const activeQuery = envQueries.find((e) => e.env.key === activeEnv);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.maxWidth}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={styles.headerPadding}>
        <TabHeader
          title="Admin · Setup"
          subtitle="Live config across all environments"
        />
      </View>

      <View style={styles.kpiWrap}>
        <HealthSummary queries={envQueries} />
      </View>

      <View style={styles.tabsRow}>
        {envQueries.map(({ env, query }) => (
          <EnvTabButton
            key={env.key}
            env={env}
            active={activeEnv === env.key}
            result={query.data ?? (query.isLoading ? { status: 'loading' } : undefined)}
            onPress={() => setActiveEnv(env.key)}
          />
        ))}
      </View>

      {activeQuery ? (
        <EnvPanel
          env={activeQuery.env}
          result={activeQuery.query.data ?? (activeQuery.query.isLoading ? { status: 'loading' } : undefined)}
          onRefresh={() => activeQuery.query.refetch()}
          isRefreshing={activeQuery.query.isRefetching}
        />
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Cap content width on wide desktop monitors so long KPI cards and
  // rows don't stretch edge-to-edge. No effect on mobile.
  maxWidth: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPadding: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.accentGlow,
    borderColor: Colors.electricBlue,
  },
  tabBtnText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  /* Panel */
  panelScroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  panelSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Sections */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  sectionCount: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.3,
  },
  sectionCountSep: {
    color: colors.textMuted,
  },
  sectionSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* Progress bar */
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* KPI summary */
  kpiWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    gap: 4,
  },
  kpiLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  kpiValueSub: {
    fontFamily: Fonts.mono.regular,
    fontSize: 14,
    color: colors.textMuted,
  },

  cardPadding: { padding: 0, overflow: 'hidden' },

  /* Rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surfaceSecondary },
  rowLeft: { flex: 1, gap: 2 },
  rowRightStack: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowKey: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    color: colors.text,
  },
  rowDesc: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowPreview: {
    fontFamily: Fonts.mono.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Pill */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  pillText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  /* Empty / error states */
  emptyTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    color: colors.text,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyMeta: {
    fontFamily: Fonts.mono.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  mono: {
    fontFamily: Fonts.mono.regular,
    fontSize: 11,
    color: colors.text,
  },
  code: {
    backgroundColor: colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.input,
    color: colors.text,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

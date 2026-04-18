import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
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
import { useAdminSetup } from '@/lib/hooks/useAdmin';
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

function SectionHeading({ icon: Icon, title, sub }: { icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>; title: string; sub?: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionIconBox}>
        <Icon size={14} color={Colors.electricBlue} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
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

export default function AdminSetupScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminSetup();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load setup data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={() => refetch()}
            style={styles.refreshBtn}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <RefreshCcw size={14} color={colors.textSecondary} strokeWidth={1.5} />
            )}
          </Pressable>
        </View>

        <TabHeader
          title="Admin · Setup"
          subtitle={`Environment: ${data.environment} · Generated ${new Date(data.generatedAt).toLocaleTimeString('en-GB')}`}
        />

        {/* ENVIRONMENT VARIABLES */}
        <SectionHeading
          icon={Key}
          title="Environment variables"
          sub={`${data.envVars.filter((v) => v.present).length} of ${data.envVars.length} set`}
        />
        <Card style={styles.cardPadding}>
          {data.envVars.map((v) => (
            <EnvVarRow key={v.key} row={v} />
          ))}
        </Card>

        {/* MIGRATIONS */}
        <SectionHeading
          icon={Database}
          title="D1 migrations"
          sub={
            data.migrations.totalApplied === data.migrations.totalInRepo
              ? `All ${data.migrations.totalInRepo} applied`
              : `${data.migrations.totalApplied} of ${data.migrations.totalInRepo} applied`
          }
        />
        <Card style={styles.cardPadding}>
          {data.migrations.rows.map((m) => (
            <MigrationRow key={m.filename} row={m} />
          ))}
        </Card>

        {/* EXTERNAL SERVICES */}
        <SectionHeading
          icon={Globe}
          title="External services"
          sub="Tap to open each provider's dashboard"
        />
        <Card style={styles.cardPadding}>
          {data.externalServices.map((s) => (
            <ServiceRow key={s.name} row={s} />
          ))}
        </Card>

        {/* RUNTIME */}
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
              ok={!data.runtime.sandboxBanking}
              label={data.runtime.sandboxBanking ? 'SANDBOX' : 'LIVE'}
            />
          </View>
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionTitle: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  sectionSub: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  cardPadding: {
    padding: 0,
    overflow: 'hidden',
  },
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
  rowPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowRightStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
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
});

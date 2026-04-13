import { useState, useRef, useEffect, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Shield, Lock, ChevronRight, ChevronDown, Check, Plus, User, LogOut, CreditCard, Bell, Landmark, RefreshCw, Eye, Trash2, Moon, Zap, Globe, PoundSterling, FileText, Download, Info, Clock } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Card } from '@/components/ui/Card';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import * as WebBrowser from 'expo-web-browser';
import { useBankConnections, useSettings, useUpdateSettings, useDisconnectBank, useSyncBank } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { getNotificationPermissionStatus } from '@/lib/notifications';
import {
  exportTransactionsCSV,
  exportExpensesCSV,
  exportInvoicesCSV,
  exportTaxSummaryCSV,
  downloadCSV,
} from '@/lib/export';
import type { BankConnection } from '@/lib/types';
import { clearCache } from '@/lib/offlineCache';
import { isBiometricAvailable, getBiometricType, authenticate, isBiometricEnabled, setBiometricEnabled } from '@/lib/biometrics';

// --------------- Custom Toggle ---------------
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
    outputRange: [Colors.midGrey, Colors.success],
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

// --------------- Icon Box ---------------
function IconBox({
  icon,
  bg,
  color = Colors.white,
}: {
  icon: React.ReactNode;
  bg: string;
  color?: string;
}) {
  return (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      {icon}
    </View>
  );
}

// --------------- Badge ---------------
function ActiveBadge() {
  return (
    <View style={styles.activeBadge}>
      <Text style={styles.activeBadgeText}>Active</Text>
    </View>
  );
}

// --------------- Row ---------------
const SettingsRow = memo(function SettingsRow({
  icon,
  iconBg,
  title,
  subtitle,
  right,
  isLast = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const content = (
    <View style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.border }]]}>
      <IconBox icon={icon} bg={iconBg} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </Pressable>
    );
  }
  return content;
});

// --------------- Chevron ---------------
function Chevron() {
  return <ChevronRight size={12} color="#666666" strokeWidth={1.5} />;
}

// --------------- Section Label ---------------
const SectionLabel = memo(function SectionLabel({ label }: { label: string }) {
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]} accessibilityRole="header">{label}</Text>;
});

// --------------- Theme Option ---------------
const ThemeOption = memo(function ThemeOption({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.themeOption} accessibilityRole="button" accessibilityLabel={`Theme: ${label}`} accessibilityState={{ selected: active }}>
      <View style={styles.themeLeft}>
        <IconBox
          icon={<Moon size={15} color={active ? Colors.white : Colors.muted} strokeWidth={1.5} />}
          bg={active ? Colors.secondary : Colors.midGrey}
        />
        <Text style={[styles.rowTitle, { marginLeft: 10, color: colors.text }]}>{label}</Text>
      </View>
      {active && <Check size={14} color={Colors.success} strokeWidth={1.5} />}
    </Pressable>
  );
});

// --------------- Relative Time ---------------
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

// --------------- Bank Connection Row ---------------
const BankConnectionRow = memo(function BankConnectionRow({
  connection,
  isLast,
  onSync,
  isSyncing,
  onDisconnect,
  isDisconnecting,
}: {
  connection: BankConnection;
  isLast: boolean;
  onSync: (id: string) => void;
  isSyncing: boolean;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}) {
  const lastSynced = formatRelativeTime(connection.lastSyncedAt);

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Bank',
      `Are you sure you want to disconnect ${connection.bankName}? Your existing transactions will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => onDisconnect(connection.id) },
      ],
    );
  };

  return (
    <View style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.border }]]}>
      <IconBox icon={<Landmark size={15} color={Colors.white} strokeWidth={1.5} />} bg={Colors.secondary} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{connection.bankName}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Synced: {lastSynced}</Text>
      </View>
      <View style={styles.bankActions}>
        <Pressable
          onPress={() => onSync(connection.id)}
          disabled={isSyncing}
          style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Sync ${connection.bankName}`}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <Text style={styles.syncText}>Sync</Text>
          )}
        </Pressable>
        <Pressable
          onPress={handleDisconnect}
          disabled={isDisconnecting}
          style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Disconnect ${connection.bankName}`}
        >
          {isDisconnecting ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Text style={styles.disconnectText}>Disconnect</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
});

// --------------- Main Screen ---------------
export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { data: bankData } = useBankConnections();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const syncBank = useSyncBank();
  const disconnectBank = useDisconnectBank();

  // Toggle states - initialise from API
  const [taxReminders, setTaxReminders] = useState(true);
  const [weeklySum, setWeeklySum] = useState(true);
  const [taxPotCheck, setTaxPotCheck] = useState(false);
  const [mtdReady, setMtdReady] = useState(true);

  // Push notification permission status
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPermissionStatus().then(setPushStatus);
  }, []);

  // Biometric lock state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) {
        getBiometricType().then(setBiometricType);
        isBiometricEnabled().then(setBiometricEnabledState);
      }
    });
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Authenticate first to confirm identity before enabling
      const success = await authenticate();
      if (!success) return;
    }
    setBiometricEnabledState(value);
    await setBiometricEnabled(value);
  };

  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Profile expand/collapse state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nino, setNino] = useState('');
  const [ninoSet, setNinoSet] = useState(false);
  const [isSavingNino, setIsSavingNino] = useState(false);

  // Sync API settings to local state
  useEffect(() => {
    if (settingsData?.user) {
      const u = settingsData.user as unknown as Record<string, unknown>;
      if (typeof u.notify_tax_deadlines === 'number') setTaxReminders(u.notify_tax_deadlines === 1);
      if (typeof u.notify_weekly_summary === 'number') setWeeklySum(u.notify_weekly_summary === 1);
      if (typeof u.notify_transaction_alerts === 'number') setTaxPotCheck(u.notify_transaction_alerts === 1);
      if (typeof u.notify_mtd_ready === 'number') setMtdReady(u.notify_mtd_ready === 1);
      if (typeof u.name === 'string') setEditName(u.name);
      if (typeof u.ninoSet === 'boolean') setNinoSet(u.ninoSet);
      if (typeof u.ninoMasked === 'string') setNino(u.ninoMasked);
    }
  }, [settingsData]);

  const handleToggle = (key: 'notifyTaxDeadlines' | 'notifyWeeklySummary' | 'notifyTransactionAlerts' | 'notifyMtdReady', value: boolean) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    updateSettings.mutate({ name: trimmed }, {
      onSettled: () => setIsSavingName(false),
    });
  };

  const handleSaveNino = () => {
    const trimmed = nino.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{6}[A-Z]$/.test(trimmed)) {
      Alert.alert('Invalid NINO', 'Please enter a valid National Insurance Number (e.g. QQ123456C)');
      return;
    }
    setIsSavingNino(true);
    updateSettings.mutate({ nino: trimmed }, {
      onSettled: () => setIsSavingNino(false),
    });
  };

  const handleExportData = () => {
    setExportModalVisible(true);
  };

  const handleExportOption = async (type: 'transactions' | 'expenses' | 'invoices' | 'tax') => {
    setIsExporting(true);
    try {
      switch (type) {
        case 'transactions': {
          const { transactions } = await api.getTransactions({ limit: 10000 });
          const csv = exportTransactionsCSV(transactions);
          downloadCSV(csv, 'transactions.csv');
          Alert.alert('Exported', 'Exported transactions.csv');
          break;
        }
        case 'expenses': {
          const { expenses } = await api.getExpenses();
          const csv = exportExpensesCSV(expenses);
          downloadCSV(csv, 'expenses.csv');
          Alert.alert('Exported', 'Exported expenses.csv');
          break;
        }
        case 'invoices': {
          const { invoices } = await api.getInvoices();
          const csv = exportInvoicesCSV(invoices);
          downloadCSV(csv, 'invoices.csv');
          Alert.alert('Exported', 'Exported invoices.csv');
          break;
        }
        case 'tax': {
          const taxData = await api.getTaxCalculation();
          const csv = exportTaxSummaryCSV(taxData);
          downloadCSV(csv, 'tax-summary.csv');
          Alert.alert('Exported', 'Exported tax-summary.csv');
          break;
        }
      }
    } catch {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setIsExporting(false);
      setExportModalVisible(false);
    }
  };

  const handleSyncBank = (id: string) => {
    syncBank.mutate(id);
  };

  const handleDisconnectBank = (id: string) => {
    disconnectBank.mutate(id);
  };

  const [isAddingBank, setIsAddingBank] = useState(false);

  // Android: dismiss browser on hardware back press during OAuth flow
  useEffect(() => {
    if (Platform.OS !== 'android' || !isAddingBank) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      WebBrowser.dismissBrowser();
      setIsAddingBank(false);
      return true;
    });
    return () => sub.remove();
  }, [isAddingBank]);

  const handleAddBank = async () => {
    if (isAddingBank) return;
    setIsAddingBank(true);
    try {
      const { url } = await api.getConnectUrl(Platform.OS !== 'web' ? 'native' : undefined);
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Connection Error', 'Could not start bank connection. Please try again.');
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleSignOut = async () => {
    await clearCache();
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await api.deleteAccount();
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '-';
  const bankConnections = bankData?.connections?.filter((c) => c.active) ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">Settings</Text>

        {/* SECURITY */}
        <SectionLabel label="SECURITY" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon={<Shield size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="Data encryption"
            subtitle="AES-256 · Bank-grade"
            right={<ActiveBadge />}
          />
          {biometricAvailable ? (
            <SettingsRow
              icon={<Lock size={15} color={Colors.white} strokeWidth={1.5} />}
              iconBg={Colors.secondary}
              title="Biometric lock"
              subtitle={biometricType}
              right={<Toggle value={biometricEnabled} onValueChange={handleBiometricToggle} />}
              accessibilityLabel="Biometric lock"
              accessibilityHint={`Toggle ${biometricType} lock on or off`}
            />
          ) : (
            <SettingsRow
              icon={<Lock size={15} color={Colors.white} strokeWidth={1.5} />}
              iconBg={Colors.secondary}
              title="Biometric lock"
              subtitle="Not available on this device"
            />
          )}
          <SettingsRow
            icon={<Eye size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="AI anonymisation"
            subtitle="Names & numbers stripped"
            right={<ActiveBadge />}
            isLast
          />
        </Card>

        {/* NOTIFICATIONS */}
        <SectionLabel label="NOTIFICATIONS" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon={<Bell size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.accent}
            title="Tax deadline reminders"
            right={<Toggle value={taxReminders} onValueChange={(v) => { setTaxReminders(v); handleToggle('notifyTaxDeadlines', v); }} />}
            accessibilityLabel="Tax deadline reminders"
            accessibilityHint="Toggle tax deadline reminders on or off"
          />
          <SettingsRow
            icon={<Zap size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="Weekly income summary"
            right={<Toggle value={weeklySum} onValueChange={(v) => { setWeeklySum(v); handleToggle('notifyWeeklySummary', v); }} />}
            accessibilityLabel="Weekly income summary"
            accessibilityHint="Toggle weekly income summary notifications on or off"
          />
          <SettingsRow
            icon={<PoundSterling size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.success}
            title="Tax pot check (monthly)"
            right={<Toggle value={taxPotCheck} onValueChange={(v) => { setTaxPotCheck(v); handleToggle('notifyTransactionAlerts', v); }} />}
            accessibilityLabel="Tax pot check, monthly"
            accessibilityHint="Toggle monthly tax pot check notifications on or off"
          />
          <SettingsRow
            icon={<FileText size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="MTD submission ready"
            right={<Toggle value={mtdReady} onValueChange={(v) => { setMtdReady(v); handleToggle('notifyMtdReady', v); }} />}
            isLast
            accessibilityLabel="MTD submission ready"
            accessibilityHint="Toggle Making Tax Digital submission ready notifications on or off"
          />
        </Card>
        {Platform.OS === 'web' ? (
          <Text style={[styles.pushStatusCaption, { color: colors.textSecondary }]}>
            Push notifications available on mobile app
          </Text>
        ) : pushStatus === 'denied' ? (
          <Text style={[styles.pushStatusCaption, { color: Colors.error }]}>
            Notifications disabled - enable in device settings
          </Text>
        ) : pushStatus === 'granted' ? (
          <Text style={[styles.pushStatusCaption, { color: colors.textSecondary }]}>
            Push notifications enabled
          </Text>
        ) : null}

        {/* CONNECTED BANKS */}
        <SectionLabel label="CONNECTED BANKS" />
        <Card style={styles.cardPadding}>
          {bankConnections.length > 0 ? (
            bankConnections.map((conn, idx) => (
              <BankConnectionRow
                key={conn.id}
                connection={conn}
                isLast={false}
                onSync={handleSyncBank}
                isSyncing={syncBank.isPending}
                onDisconnect={handleDisconnectBank}
                isDisconnecting={disconnectBank.isPending}
              />
            ))
          ) : (
            <View style={styles.noBanksRow}>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>No banks connected yet</Text>
            </View>
          )}
          <Pressable
            onPress={handleAddBank}
            disabled={isAddingBank}
            style={({ pressed }) => [styles.addBankButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add bank"
            accessibilityHint="Tap to connect a new bank account"
          >
            {isAddingBank ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <>
                <Plus size={12} color={Colors.secondary} strokeWidth={1.5} />
                <Text style={styles.addBankText}>Add Bank</Text>
              </>
            )}
          </Pressable>
        </Card>

        {/* ACCOUNT */}
        <SectionLabel label="ACCOUNT" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon={<User size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="Profile & account"
            subtitle={userEmail}
            right={
              profileExpanded
                ? <ChevronDown size={12} color="#666666" strokeWidth={1.5} />
                : <ChevronRight size={12} color="#666666" strokeWidth={1.5} />
            }
            onPress={() => setProfileExpanded((prev) => !prev)}
          />
          {profileExpanded && (
            <View style={styles.profileExpandedSection}>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary, marginBottom: 6 }]}>
                Email: {userEmail}
              </Text>
              <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 4, fontSize: 11 }]}>
                Change name
              </Text>
              <View style={styles.nameInputRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.muted}
                  autoCapitalize="words"
                  accessibilityLabel="Your name"
                  accessibilityHint="Enter your display name"
                />
                <Pressable
                  onPress={handleSaveName}
                  disabled={isSavingName || !editName.trim()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                    (!editName.trim() || isSavingName) && styles.saveButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save name"
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
              <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 4, fontSize: 11, marginTop: 12 }]}>
                National Insurance Number {ninoSet && <Text style={{ color: Colors.success, fontSize: 11 }}>(saved)</Text>}
              </Text>
              <View style={styles.nameInputRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                  value={nino}
                  onChangeText={setNino}
                  placeholder="QQ123456C"
                  placeholderTextColor={Colors.muted}
                  autoCapitalize="characters"
                  maxLength={9}
                  accessibilityLabel="National Insurance Number"
                  accessibilityHint="Enter your NINO for HMRC submissions"
                />
                <Pressable
                  onPress={handleSaveNino}
                  disabled={isSavingNino || !nino.trim()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                    (!nino.trim() || isSavingNino) && styles.saveButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save NINO"
                >
                  {isSavingNino ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
          <SettingsRow
            icon={<CreditCard size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.accent}
            title="Manage Plan"
            subtitle="View or change your subscription"
            right={<Chevron />}
            onPress={() => router.push('/billing')}
          />
          <SettingsRow
            icon={<Clock size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.accent}
            title="Tax History"
            subtitle="Multi-year tax overview"
            right={<Chevron />}
            onPress={() => router.push('/tax-history')}
          />
          <SettingsRow
            icon={<FileText size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="HMRC MTD"
            subtitle="Making Tax Digital submissions"
            right={<Chevron />}
            onPress={() => router.push('/mtd')}
          />
          <SettingsRow
            icon={<FileText size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.accent}
            title="Self Assessment"
            subtitle="SA103 annual tax summary"
            right={<Chevron />}
            onPress={() => router.push('/self-assessment')}
          />
          <SettingsRow
            icon={<Download size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.success}
            title="Export data"
            subtitle="Download CSV or PDF"
            right={<Chevron />}
            isLast
            onPress={handleExportData}
          />
        </Card>

        {/* ABOUT */}
        <SectionLabel label="ABOUT" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon={<Globe size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg={Colors.secondary}
            title="System Status"
            subtitle="Monitoring & diagnostics"
            right={<Chevron />}
            onPress={() => router.push('/status')}
          />
          <SettingsRow
            icon={<Info size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg="#666666"
            title="App version"
            subtitle={Constants.expoConfig?.version ?? '0.1.0'}
          />
          <SettingsRow
            icon={<FileText size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg="#666666"
            title="Terms of Service"
            right={<Chevron />}
            onPress={() => router.push('/terms')}
          />
          <SettingsRow
            icon={<Shield size={15} color={Colors.white} strokeWidth={1.5} />}
            iconBg="#666666"
            title="Privacy Policy"
            right={<Chevron />}
            isLast
            onPress={() => router.push('/privacy')}
          />
        </Card>

        {/* Sign out button */}
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityHint="Tap to sign out of your account"
        >
          <Text style={[styles.signOutText, { color: colors.text }]}>Sign out</Text>
        </Pressable>

        {/* Delete account */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete account" accessibilityHint="Tap to permanently delete your account and all data">
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !isExporting && setExportModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Export Data</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose data to export as CSV
            </Text>

            {isExporting ? (
              <ActivityIndicator size="large" color={Colors.secondary} style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.modalOptions}>
                <Pressable
                  style={({ pressed }) => [styles.modalOption, pressed && styles.pressed]}
                  onPress={() => handleExportOption('transactions')}
                  accessibilityRole="button"
                  accessibilityLabel="Export Transactions"
                >
                  <IconBox icon={<RefreshCw size={15} color={Colors.white} strokeWidth={1.5} />} bg={Colors.secondary} />
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>Export Transactions</Text>
                </Pressable>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  style={({ pressed }) => [styles.modalOption, pressed && styles.pressed]}
                  onPress={() => handleExportOption('expenses')}
                  accessibilityRole="button"
                  accessibilityLabel="Export Expenses"
                >
                  <IconBox icon={<CreditCard size={15} color={Colors.white} strokeWidth={1.5} />} bg={Colors.error} />
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>Export Expenses</Text>
                </Pressable>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  style={({ pressed }) => [styles.modalOption, pressed && styles.pressed]}
                  onPress={() => handleExportOption('invoices')}
                  accessibilityRole="button"
                  accessibilityLabel="Export Invoices"
                >
                  <IconBox icon={<FileText size={15} color={Colors.white} strokeWidth={1.5} />} bg={Colors.accent} />
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>Export Invoices</Text>
                </Pressable>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  style={({ pressed }) => [styles.modalOption, pressed && styles.pressed]}
                  onPress={() => handleExportOption('tax')}
                  accessibilityRole="button"
                  accessibilityLabel="Export Tax Summary"
                >
                  <IconBox icon={<PoundSterling size={15} color={Colors.white} strokeWidth={1.5} />} bg={Colors.success} />
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>Export Tax Summary</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && styles.pressed]}
              onPress={() => setExportModalVisible(false)}
              disabled={isExporting}
              accessibilityRole="button"
              accessibilityLabel="Cancel export"
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
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
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  title: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  cardPadding: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rowBorderOnly: {
    height: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12.5,
  },
  rowSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10.5,
    marginTop: 1,
  },
  activeBadge: {
    backgroundColor: 'rgba(0,200,83,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  activeBadgeText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10.5,
    color: Colors.success,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: Colors.midGrey,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signOutText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  deleteText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: Colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
  comingSoonBadge: {
    backgroundColor: Colors.midGrey,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  comingSoonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10.5,
    color: Colors.muted,
  },
  profileExpandedSection: {
    paddingLeft: 40,
    paddingBottom: 10,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    color: Colors.white,
  },
  bankActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  syncText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10.5,
    color: Colors.secondary,
  },
  disconnectButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  disconnectText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 10.5,
    color: Colors.error,
  },
  noBanksRow: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.midGrey,
    marginTop: 4,
  },
  addBankText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12.5,
    color: Colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontFamily: Fonts.lexend.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalOptions: {
    marginBottom: Spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOptionText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
    marginLeft: 10,
  },
  modalDivider: {
    height: 1,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 13,
  },
  pushStatusCaption: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 10.5,
    marginLeft: Spacing.xs,
    marginTop: 2,
  },
});

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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useBankConnections, useSettings, useUpdateSettings, useDisconnectBank } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/ThemeContext';
import type { BankConnection } from '@/lib/types';

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
    outputRange: [Colors.grey[300], Colors.success],
  });

  const knobTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
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
  name,
  bg,
  color = Colors.white,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  bg: string;
  color?: string;
}) {
  return (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <FontAwesome name={name} size={15} color={color} />
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
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.border }]]}>
      <IconBox name={icon} bg={iconBg} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
});

// --------------- Chevron ---------------
function Chevron() {
  return <FontAwesome name="chevron-right" size={12} color={Colors.grey[400]} />;
}

// --------------- Section Label ---------------
const SectionLabel = memo(function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>;
});

// --------------- Theme Option ---------------
const ThemeOption = memo(function ThemeOption({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.themeOption}>
      <View style={styles.themeLeft}>
        <IconBox
          name={icon}
          bg={active ? Colors.secondary : Colors.grey[200]}
          color={active ? Colors.white : Colors.grey[500]}
        />
        <Text style={[styles.rowTitle, { marginLeft: 10, color: colors.text }]}>{label}</Text>
      </View>
      {active && <FontAwesome name="check" size={14} color={Colors.success} />}
    </Pressable>
  );
});

// --------------- Bank Connection Row ---------------
const BankConnectionRow = memo(function BankConnectionRow({
  connection,
  isLast,
  onDisconnect,
  isDisconnecting,
}: {
  connection: BankConnection;
  isLast: boolean;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}) {
  const { colors } = useTheme();
  const lastSynced = connection.lastSyncedAt
    ? new Date(connection.lastSyncedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Never';

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Bank',
      `Are you sure you want to disconnect ${connection.bankName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => onDisconnect(connection.id) },
      ],
    );
  };

  return (
    <View style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.border }]]}>
      <IconBox name="bank" bg={Colors.secondary} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{connection.bankName}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Last synced: {lastSynced}</Text>
      </View>
      <Pressable
        onPress={handleDisconnect}
        disabled={isDisconnecting}
        style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}
      >
        {isDisconnecting ? (
          <ActivityIndicator size="small" color={Colors.error} />
        ) : (
          <Text style={styles.disconnectText}>Disconnect</Text>
        )}
      </Pressable>
    </View>
  );
});

// --------------- Main Screen ---------------
export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { data: bankData } = useBankConnections();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const disconnectBank = useDisconnectBank();

  // Toggle states — initialise from API
  const [taxReminders, setTaxReminders] = useState(true);
  const [weeklySum, setWeeklySum] = useState(true);
  const [taxPotCheck, setTaxPotCheck] = useState(false);
  const [mtdReady, setMtdReady] = useState(true);

  // Profile expand/collapse state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Sync API settings to local state
  useEffect(() => {
    if (settingsData?.user) {
      const u = settingsData.user as unknown as Record<string, unknown>;
      if (typeof u.notify_tax_deadlines === 'number') setTaxReminders(u.notify_tax_deadlines === 1);
      if (typeof u.notify_weekly_summary === 'number') setWeeklySum(u.notify_weekly_summary === 1);
      if (typeof u.notify_transaction_alerts === 'number') setTaxPotCheck(u.notify_transaction_alerts === 1);
      if (typeof u.notify_mtd_ready === 'number') setMtdReady(u.notify_mtd_ready === 1);
      if (typeof u.name === 'string') setEditName(u.name);
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

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export coming soon. You will be able to download your data as CSV or PDF.');
  };

  const handleDisconnectBank = (id: string) => {
    disconnectBank.mutate(id);
  };

  const handleSignOut = async () => {
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

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '—';
  const bankConnections = bankData?.connections?.filter((c) => c.active) ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* SECURITY */}
        <SectionLabel label="SECURITY" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon="shield"
            iconBg={Colors.secondary}
            title="Data encryption"
            subtitle="AES-256 · Bank-grade"
            right={<ActiveBadge />}
          />
          <SettingsRow
            icon="lock"
            iconBg={Colors.secondary}
            title="Biometric lock"
            subtitle="Coming soon"
            right={
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            }
          />
          <SettingsRow
            icon="eye"
            iconBg={Colors.secondary}
            title="AI anonymisation"
            subtitle="Names & numbers stripped"
            right={<ActiveBadge />}
            isLast
          />
        </Card>

        {/* APPEARANCE */}
        <SectionLabel label="APPEARANCE" />
        <Card style={styles.cardPadding}>
          <ThemeOption
            icon="sun-o"
            label="Light"
            active={mode === 'light'}
            onPress={() => setMode('light')}
          />
          <View style={[styles.rowBorderOnly, { backgroundColor: colors.border }]} />
          <ThemeOption
            icon="moon-o"
            label="Dark"
            active={mode === 'dark'}
            onPress={() => setMode('dark')}
          />
          <View style={[styles.rowBorderOnly, { backgroundColor: colors.border }]} />
          <ThemeOption
            icon="desktop"
            label="Auto"
            active={mode === 'auto'}
            onPress={() => setMode('auto')}
          />
        </Card>

        {/* NOTIFICATIONS */}
        <SectionLabel label="NOTIFICATIONS" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon="bell"
            iconBg={Colors.accent}
            title="Tax deadline reminders"
            right={<Toggle value={taxReminders} onValueChange={(v) => { setTaxReminders(v); handleToggle('notifyTaxDeadlines', v); }} />}
          />
          <SettingsRow
            icon="bar-chart"
            iconBg={Colors.secondary}
            title="Weekly income summary"
            right={<Toggle value={weeklySum} onValueChange={(v) => { setWeeklySum(v); handleToggle('notifyWeeklySummary', v); }} />}
          />
          <SettingsRow
            icon="gbp"
            iconBg={Colors.success}
            title="Tax pot check (monthly)"
            right={<Toggle value={taxPotCheck} onValueChange={(v) => { setTaxPotCheck(v); handleToggle('notifyTransactionAlerts', v); }} />}
          />
          <SettingsRow
            icon="file-text-o"
            iconBg={Colors.secondary}
            title="MTD submission ready"
            right={<Toggle value={mtdReady} onValueChange={(v) => { setMtdReady(v); handleToggle('notifyMtdReady', v); }} />}
            isLast
          />
        </Card>

        {/* CONNECTED BANKS */}
        {bankConnections.length > 0 && (
          <>
            <SectionLabel label="CONNECTED BANKS" />
            <Card style={styles.cardPadding}>
              {bankConnections.map((conn, idx) => (
                <BankConnectionRow
                  key={conn.id}
                  connection={conn}
                  isLast={idx === bankConnections.length - 1}
                  onDisconnect={handleDisconnectBank}
                  isDisconnecting={disconnectBank.isPending}
                />
              ))}
            </Card>
          </>
        )}

        {/* ACCOUNT */}
        <SectionLabel label="ACCOUNT" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon="user"
            iconBg={Colors.secondary}
            title="Profile & account"
            subtitle={userEmail}
            right={
              <FontAwesome
                name={profileExpanded ? 'chevron-down' : 'chevron-right'}
                size={12}
                color={Colors.grey[400]}
              />
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
                  placeholderTextColor={Colors.grey[400]}
                  autoCapitalize="words"
                />
                <Pressable
                  onPress={handleSaveName}
                  disabled={isSavingName || !editName.trim()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                    (!editName.trim() || isSavingName) && styles.saveButtonDisabled,
                  ]}
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
          <SettingsRow
            icon="download"
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
            icon="info-circle"
            iconBg={Colors.grey[400]}
            title="App version"
            subtitle="1.0.0 (build 42)"
          />
          <SettingsRow
            icon="file-o"
            iconBg={Colors.grey[400]}
            title="Terms of Service"
            right={<Chevron />}
            onPress={() => Linking.openURL('https://quidsafe.pages.dev/terms')}
          />
          <SettingsRow
            icon="shield"
            iconBg={Colors.grey[400]}
            title="Privacy Policy"
            right={<Chevron />}
            isLast
            onPress={() => Linking.openURL('https://quidsafe.pages.dev/privacy')}
          />
        </Card>

        {/* Sign out button */}
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutText, { color: colors.text }]}>Sign out</Text>
        </Pressable>

        {/* Delete account */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
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
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: 'Manrope_600SemiBold',
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
  },
  rowSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10.5,
    marginTop: 1,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  activeBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
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
    borderColor: Colors.grey[300],
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signOutText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  deleteText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: Colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
  comingSoonBadge: {
    backgroundColor: Colors.grey[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  comingSoonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    color: Colors.grey[500],
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
    fontFamily: 'Manrope_400Regular',
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
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  disconnectButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  disconnectText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10.5,
    color: Colors.error,
  },
});

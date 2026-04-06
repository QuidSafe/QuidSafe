import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useBankConnections, useApiToken, useSettings, useUpdateSettings } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';

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
function SettingsRow({
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
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <IconBox name={icon} bg={iconBg} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
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
}

// --------------- Chevron ---------------
function Chevron() {
  return <FontAwesome name="chevron-right" size={12} color={Colors.grey[400]} />;
}

// --------------- Section Label ---------------
function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// --------------- Theme Option ---------------
function ThemeOption({
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
  return (
    <Pressable onPress={onPress} style={styles.themeOption}>
      <View style={styles.themeLeft}>
        <IconBox
          name={icon}
          bg={active ? Colors.secondary : Colors.grey[200]}
          color={active ? Colors.white : Colors.grey[500]}
        />
        <Text style={[styles.rowTitle, { marginLeft: 10 }]}>{label}</Text>
      </View>
      {active && <FontAwesome name="check" size={14} color={Colors.success} />}
    </Pressable>
  );
}

// --------------- Main Screen ---------------
export default function SettingsScreen() {
  useApiToken();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { data: _bankData } = useBankConnections();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const _systemScheme = useColorScheme();

  // Toggle states — initialise from API
  const [biometricLock, setBiometricLock] = useState(true);
  const [taxReminders, setTaxReminders] = useState(true);
  const [weeklySum, setWeeklySum] = useState(true);
  const [taxPotCheck, setTaxPotCheck] = useState(false);
  const [mtdReady, setMtdReady] = useState(true);

  // Sync API settings to local state
  useEffect(() => {
    if (settingsData?.user) {
      const u = settingsData.user as unknown as Record<string, unknown>;
      if (typeof u.notify_tax_deadlines === 'number') setTaxReminders(u.notify_tax_deadlines === 1);
      if (typeof u.notify_weekly_summary === 'number') setWeeklySum(u.notify_weekly_summary === 1);
      if (typeof u.notify_transaction_alerts === 'number') setTaxPotCheck(u.notify_transaction_alerts === 1);
    }
  }, [settingsData]);

  const handleToggle = (key: 'notifyTaxDeadlines' | 'notifyWeeklySummary' | 'notifyTransactionAlerts', value: boolean) => {
    updateSettings.mutate({ [key]: value });
  };

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

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
            subtitle="Face ID / Fingerprint"
            right={<Toggle value={biometricLock} onValueChange={setBiometricLock} />}
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
            active={theme === 'light'}
            onPress={() => setTheme('light')}
          />
          <View style={styles.rowBorderOnly} />
          <ThemeOption
            icon="moon-o"
            label="Dark"
            active={theme === 'dark'}
            onPress={() => setTheme('dark')}
          />
          <View style={styles.rowBorderOnly} />
          <ThemeOption
            icon="desktop"
            label="Auto"
            active={theme === 'auto'}
            onPress={() => setTheme('auto')}
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
            right={<Toggle value={mtdReady} onValueChange={setMtdReady} />}
            isLast
          />
        </Card>

        {/* ACCOUNT */}
        <SectionLabel label="ACCOUNT" />
        <Card style={styles.cardPadding}>
          <SettingsRow
            icon="user"
            iconBg={Colors.secondary}
            title="Profile & account"
            subtitle={userEmail}
            right={<Chevron />}
            onPress={() => {}}
          />
          <SettingsRow
            icon="download"
            iconBg={Colors.success}
            title="Export data"
            subtitle="Download CSV or PDF"
            right={<Chevron />}
            isLast
            onPress={() => {}}
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
            onPress={() => {}}
          />
          <SettingsRow
            icon="shield"
            iconBg={Colors.grey[400]}
            title="Privacy Policy"
            right={<Chevron />}
            isLast
            onPress={() => {}}
          />
        </Card>

        {/* Sign out button */}
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
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
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: Colors.grey[400],
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
    borderBottomColor: Colors.light.border,
  },
  rowBorderOnly: {
    height: 1,
    backgroundColor: Colors.light.border,
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
    color: Colors.light.text,
  },
  rowSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 10.5,
    color: Colors.grey[400],
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
    color: Colors.light.text,
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
});

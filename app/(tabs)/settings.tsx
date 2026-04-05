import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useBankConnections, useApiToken } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';

export default function SettingsScreen() {
  useApiToken();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { data: bankData } = useBankConnections();

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Account */}
        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{user?.fullName ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.primaryEmailAddress?.emailAddress ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Free Trial</Text>
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <Card>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Deadline reminders</Text>
            <Switch trackColor={{ false: Colors.grey[300], true: Colors.secondary }} thumbColor={Colors.white} value={true} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Weekly summary</Text>
            <Switch trackColor={{ false: Colors.grey[300], true: Colors.secondary }} thumbColor={Colors.white} value={true} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tax pot check</Text>
            <Switch trackColor={{ false: Colors.grey[300], true: Colors.secondary }} thumbColor={Colors.white} value={false} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>MTD ready</Text>
            <Switch trackColor={{ false: Colors.grey[300], true: Colors.secondary }} thumbColor={Colors.white} value={true} />
          </View>
        </Card>

        {/* Connected Banks */}
        <Card>
          <Text style={styles.sectionTitle}>Connected Banks</Text>
          {bankData?.connections && bankData.connections.length > 0 ? (
            bankData.connections.map((conn) => (
              <View key={conn.id} style={styles.row}>
                <Text style={styles.rowLabel}>{conn.bankName}</Text>
                <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                  <Text style={styles.badgeText}>Connected</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No banks connected yet.</Text>
          )}
        </Card>

        {/* About */}
        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>0.1.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Backend</Text>
            <Text style={styles.rowValue}>Cloudflare Workers</Text>
          </View>
        </Card>

        {/* Actions */}
        <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={handleSignOut}>
          <Text style={styles.outlineButtonText}>Sign Out</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={styles.dangerText}>Delete Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.light.text },
  sectionTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.light.text, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  rowLabel: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: Colors.light.text },
  rowValue: { fontFamily: 'Manrope_500Medium', fontSize: 15, color: Colors.light.textSecondary, maxWidth: '55%', textAlign: 'right' },
  badge: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.pill },
  badgeText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: Colors.white },
  emptyText: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  outlineButton: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.button, paddingVertical: Spacing.md, alignItems: 'center' },
  outlineButtonText: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.primary },
  pressed: { opacity: 0.85 },
  dangerButton: { alignItems: 'center', paddingVertical: Spacing.md },
  dangerText: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.error },
});

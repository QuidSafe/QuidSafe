import { StyleSheet, View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>—</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Free</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Deadline reminders</Text>
            <Switch
              trackColor={{ false: Colors.grey[300], true: Colors.secondary }}
              thumbColor={Colors.white}
              value={true}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Weekly summary</Text>
            <Switch
              trackColor={{ false: Colors.grey[300], true: Colors.secondary }}
              thumbColor={Colors.white}
              value={false}
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Connected Banks</Text>
          <Text style={styles.emptyText}>No banks connected yet.</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>0.1.0</Text>
          </View>
        </Card>

        <Pressable style={styles.dangerButton}>
          <Text style={styles.dangerText}>Sign Out</Text>
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
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rowLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: Colors.light.text,
  },
  rowValue: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  badge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  dangerButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dangerText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.error,
  },
});

import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing } from '@/constants/Colors';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>Welcome to QuidSafe</Text>
        </View>

        <Card style={styles.taxCard}>
          <Text style={styles.taxLabel}>Estimated Tax Owed</Text>
          <Text style={styles.taxAmount}>£0.00</Text>
          <Text style={styles.taxSubtext}>
            Connect your bank to start tracking
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Set Aside Monthly</Text>
          <Text style={styles.sectionValue}>£0.00</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtext}>
            Connect bank · Add expense · View tax breakdown
          </Text>
        </Card>
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
  header: {
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
    marginTop: 2,
  },
  taxCard: {
    backgroundColor: Colors.primary,
  },
  taxLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  taxAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 36,
    color: Colors.white,
    marginTop: 4,
  },
  taxSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
  },
  sectionValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: Colors.secondary,
    marginTop: 4,
  },
  sectionSubtext: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
});

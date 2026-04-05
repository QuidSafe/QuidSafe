import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing } from '@/constants/Colors';

export default function IncomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Income</Text>

        <Card>
          <Text style={styles.label}>Total Income (Year)</Text>
          <Text style={styles.amount}>£0.00</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>By Source</Text>
          <Text style={styles.emptyText}>
            Connect your bank account to see income broken down by source.
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <Text style={styles.emptyText}>
            Your month-by-month income chart will appear here.
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
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
  },
  label: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  amount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    color: Colors.secondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

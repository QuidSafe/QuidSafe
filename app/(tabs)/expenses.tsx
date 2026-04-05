import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useExpenses, useAddExpense, useApiToken } from '@/lib/hooks/useApi';
import { formatCurrency } from '@/lib/tax-engine';

export default function ExpensesScreen() {
  useApiToken();
  const { data, isLoading, refetch, isRefetching } = useExpenses();
  const addExpense = useAddExpense();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const expenses = (data?.expenses ?? []) as { id: string; amount: number; description: string; date: string; hmrc_category?: string }[];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAdd = async () => {
    if (!amount || !description || !/^[0-9]+(\.[0-9]{1,2})?$/.test(amount)) return;
    await addExpense.mutateAsync({
      amount: Number(amount),
      description,
      date: new Date().toISOString().split('T')[0],
    });
    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Expenses</Text>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={() => setShowForm(!showForm)}
          >
            <FontAwesome name="plus" size={14} color={Colors.white} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>

        {/* Total */}
        <Card>
          <Text style={styles.totalLabel}>Total Claimed</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
          <Text style={styles.totalHint}>Tax saving: {formatCurrency(totalExpenses * 0.2)}</Text>
        </Card>

        {/* Add Form */}
        {showForm && (
          <Card>
            <Text style={styles.formTitle}>New Expense</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 45.99)"
              placeholderTextColor={Colors.grey[500]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor={Colors.grey[500]}
              value={description}
              onChangeText={setDescription}
            />
            <Pressable style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]} onPress={handleAdd}>
              <Text style={styles.submitText}>
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Text>
            </Pressable>
          </Card>
        )}

        {/* Expense List */}
        {isLoading ? (
          <SkeletonCard />
        ) : expenses.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {expenses.map((exp) => (
              <View key={exp.id} style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseDesc}>{exp.description}</Text>
                  <Text style={styles.expenseDate}>{exp.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>{formatCurrency(exp.amount)}</Text>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <FontAwesome name="file-text-o" size={32} color={Colors.grey[400]} />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>
                Add business expenses to reduce your tax bill. Every little helps!
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.light.text },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.pill, ...Shadows.soft },
  addText: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.white },
  pressed: { opacity: 0.85 },

  totalLabel: { fontFamily: 'Manrope_500Medium', fontSize: 13, color: Colors.light.textSecondary },
  totalAmount: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, color: Colors.primary, marginTop: 4 },
  totalHint: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 4 },

  formTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.light.text, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.light.background, borderRadius: BorderRadius.input, paddingVertical: 14, paddingHorizontal: Spacing.md, fontFamily: 'Manrope_400Regular', fontSize: 15, color: Colors.light.text, marginBottom: Spacing.sm },
  submitButton: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: BorderRadius.button, alignItems: 'center', marginTop: Spacing.sm },
  submitText: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: Colors.white },

  sectionTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.light.text, marginBottom: Spacing.md },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  expenseLeft: { flex: 1 },
  expenseDesc: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: Colors.light.text },
  expenseDate: { fontFamily: 'Manrope_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  expenseAmount: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: Colors.error },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.light.text, marginTop: Spacing.md },
  emptyText: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});

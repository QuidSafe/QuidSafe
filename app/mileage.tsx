import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Car, Bike, Trash2 } from 'lucide-react-native';
import { colors, Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useMileage } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';

const VEHICLE_TYPES = [
  { id: 'car', label: 'Car/Van', rate: '45p/mile', Icon: Car },
  { id: 'motorcycle', label: 'Motorcycle', rate: '24p/mile', Icon: Bike },
  { id: 'bicycle', label: 'Bicycle', rate: '20p/mile', Icon: Bike },
] as const;

export default function MileageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, refetch } = useMileage();
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState('');
  const [miles, setMiles] = useState('');
  const [vehicle, setVehicle] = useState<'car' | 'motorcycle' | 'bicycle'>('car');
  const [purpose, setPurpose] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!desc.trim() || !miles.trim()) {
      Alert.alert('Missing info', 'Enter a description and miles driven.');
      return;
    }
    setAdding(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.addMileage({ tripDate: today, description: desc.trim(), miles: parseFloat(miles), vehicleType: vehicle, purpose: purpose.trim() || undefined });
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      setDesc(''); setMiles(''); setPurpose(''); setShowAdd(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save trip.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMileage(id);
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
    } catch {
      Alert.alert('Error', 'Could not delete trip.');
    }
  };

  const logs = data?.logs ?? [];
  const summary = data?.summary;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={() => setShowAdd(!showAdd)} style={s.addBtn} accessibilityRole="button" accessibilityLabel="Log a trip">
            <Plus size={16} color={Colors.electricBlue} strokeWidth={2} />
            <Text style={s.addBtnText}>Log trip</Text>
          </Pressable>
        </View>

        <Text style={s.eyebrow}>MILEAGE</Text>
        <Text style={s.title} accessibilityRole="header">Business miles</Text>

        {summary && (
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <View>
                <Text style={s.summaryLabel}>Total miles</Text>
                <Text style={s.summaryVal}>{summary.totalMiles.toFixed(1)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={s.summaryLabel}>Claimable</Text>
                <Text style={s.summaryValBlue}>{formatCurrency(summary.totalAmount)}</Text>
              </View>
            </View>
          </View>
        )}

        {showAdd && (
          <View style={s.addCard}>
            <Text style={s.addTitle}>New trip</Text>
            <View style={s.vehicleRow}>
              {VEHICLE_TYPES.map(({ id, label, rate, Icon }) => (
                <Pressable key={id} onPress={() => setVehicle(id as any)} style={[s.vehiclePill, vehicle === id && s.vehiclePillActive]}>
                  <Icon size={14} color={vehicle === id ? Colors.white : colors.textSecondary} strokeWidth={1.5} />
                  <Text style={[s.vehicleText, vehicle === id && s.vehicleTextActive]}>{label}</Text>
                  <Text style={[s.vehicleRate, vehicle === id && s.vehicleTextActive]}>{rate}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={s.input} value={desc} onChangeText={setDesc} placeholder="Where did you go?" placeholderTextColor={colors.textMuted} accessibilityLabel="Trip description" />
            <TextInput style={s.input} value={miles} onChangeText={(v) => setMiles(v.replace(/[^\d.]/g, ''))} placeholder="Miles driven" placeholderTextColor={colors.textMuted} keyboardType="numeric" inputMode="decimal" accessibilityLabel="Miles driven" />
            <TextInput style={s.input} value={purpose} onChangeText={setPurpose} placeholder="Business purpose (optional)" placeholderTextColor={colors.textMuted} accessibilityLabel="Business purpose" />
            <Pressable style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleAdd} disabled={adding} accessibilityRole="button">
              <Text style={s.saveBtnText}>{adding ? 'Saving...' : 'Save trip'}</Text>
            </Pressable>
          </View>
        )}

        {logs.length === 0 ? (
          <View style={s.emptyCard}>
            <Car size={32} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>No trips logged yet</Text>
            <Text style={s.emptyBody}>Tap &ldquo;Log trip&rdquo; to start tracking your business miles. HMRC approved rates applied automatically.</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {logs.map((log: any, i: number) => (
              <View key={log.id} style={[s.logRow, i < logs.length - 1 && s.logRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.logDesc}>{log.description}</Text>
                  <Text style={s.logMeta}>{new Date(log.trip_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {log.miles} miles - {log.vehicle_type}</Text>
                </View>
                <Text style={s.logAmount}>{formatCurrency(log.amount)}</Text>
                <Pressable onPress={() => handleDelete(log.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete trip">
                  <Trash2 size={14} color={Colors.error} strokeWidth={1.5} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={s.footnote}>
          HMRC 2025/26 rates: Cars/vans 45p (first 10,000 miles), 25p thereafter. Motorcycles 24p. Bicycles 20p.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2, maxWidth: 640, width: '100%', alignSelf: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.blueGlow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.electricBlue },

  eyebrow: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: Colors.electricBlue, letterSpacing: 1.4 },
  title: { fontFamily: Fonts.lexend.semiBold, fontSize: 28, letterSpacing: -0.6, color: Colors.white, marginTop: 4, marginBottom: Spacing.lg },

  summaryCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.electricBlue, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  summaryLabel: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  summaryVal: { fontFamily: Fonts.mono.semiBold, fontSize: 28, color: Colors.white, letterSpacing: -1 },
  summaryValBlue: { fontFamily: Fonts.mono.semiBold, fontSize: 28, color: Colors.electricBlue, letterSpacing: -1 },

  addCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: Spacing.lg, gap: 10, marginBottom: Spacing.md },
  addTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 4 },
  vehicleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  vehiclePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.darkGrey, borderWidth: 1, borderColor: colors.border },
  vehiclePillActive: { backgroundColor: Colors.electricBlue, borderColor: Colors.electricBlue },
  vehicleText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 12, color: colors.textSecondary },
  vehicleTextActive: { color: Colors.white },
  vehicleRate: { fontFamily: Fonts.mono.regular, fontSize: 10, color: colors.textMuted },

  input: {
    backgroundColor: Colors.darkGrey, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: Fonts.sourceSans.regular, fontSize: 14, color: Colors.white,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },

  saveBtn: { backgroundColor: Colors.electricBlue, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.white },

  emptyCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: Spacing.xl, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white },
  emptyBody: { fontFamily: Fonts.sourceSans.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },

  listCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: Spacing.md },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  logDesc: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.white },
  logMeta: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  logAmount: { fontFamily: Fonts.mono.semiBold, fontSize: 14, color: Colors.success, marginRight: 8 },

  footnote: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' },
});

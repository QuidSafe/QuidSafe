import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Mail, Phone, Trash2, ChevronRight } from 'lucide-react-native';
import { colors, Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useClients } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/tax-engine';

export default function ClientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useClients();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Missing name', 'Enter a client name.'); return; }
    setAdding(true);
    try {
      await api.createClient({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setName(''); setEmail(''); setPhone(''); setShowAdd(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save client.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    Alert.alert('Delete client?', `Remove ${clientName}? Their invoices will be kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteClient(id);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
          } catch { Alert.alert('Error', 'Could not delete client.'); }
        },
      },
    ]);
  };

  const clients = data?.clients ?? [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={() => setShowAdd(!showAdd)} style={s.addBtn} accessibilityRole="button" accessibilityLabel="Add client">
            <Plus size={16} color={Colors.electricBlue} strokeWidth={2} />
            <Text style={s.addBtnText}>Add client</Text>
          </Pressable>
        </View>

        <Text style={s.eyebrow}>CLIENTS</Text>
        <Text style={s.title} accessibilityRole="header">Your customers</Text>

        {showAdd && (
          <View style={s.addCard}>
            <Text style={s.addTitle}>New client</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Client or business name" placeholderTextColor={colors.textMuted} accessibilityLabel="Client name" />
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email (optional)" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email" />
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" accessibilityLabel="Phone" />
            <Pressable style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]} onPress={handleAdd} disabled={adding} accessibilityRole="button">
              <Text style={s.saveBtnText}>{adding ? 'Saving...' : 'Save client'}</Text>
            </Pressable>
          </View>
        )}

        {clients.length === 0 ? (
          <View style={s.emptyCard}>
            <Users size={32} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>No clients yet</Text>
            <Text style={s.emptyBody}>Add your clients to track invoices and payments per customer.</Text>
            <Pressable
              style={({ pressed }) => [s.emptyCta, pressed && { opacity: 0.85 }]}
              onPress={() => setShowAdd(true)}
              accessibilityRole="button"
              accessibilityLabel="Add your first client"
            >
              <Plus size={14} color={Colors.white} strokeWidth={2} />
              <Text style={s.emptyCtaText}>Add client</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.listCard}>
            {clients.map((client: any, i: number) => (
              <View key={client.id} style={[s.clientRow, i < clients.length - 1 && s.clientRowBorder]}>
                <View style={s.clientAvatar}>
                  <Text style={s.clientInitial}>{(client.name || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.clientName}>{client.name}</Text>
                  <View style={s.clientMeta}>
                    {client.email && (
                      <View style={s.metaRow}>
                        <Mail size={10} color={colors.textMuted} strokeWidth={1.5} />
                        <Text style={s.metaText}>{client.email}</Text>
                      </View>
                    )}
                    <Text style={s.metaText}>
                      {client.invoice_count || 0} invoice{(client.invoice_count || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={s.clientRight}>
                  {(client.outstanding || 0) > 0 && (
                    <Text style={s.clientOutstanding}>{formatCurrency(client.outstanding)} due</Text>
                  )}
                  <Pressable onPress={() => handleDelete(client.id, client.name)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${client.name}`}>
                    <Trash2 size={14} color={Colors.error} strokeWidth={1.5} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
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

  addCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: Spacing.lg, gap: 10, marginBottom: Spacing.md },
  addTitle: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.white, marginBottom: 4 },
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
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.electricBlue, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  emptyCtaText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.white },

  listCard: { backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: Spacing.md },
  clientRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  clientAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.blueGlow, alignItems: 'center', justifyContent: 'center' },
  clientInitial: { fontFamily: Fonts.lexend.semiBold, fontSize: 16, color: Colors.electricBlue },
  clientName: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.white },
  clientMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.sourceSans.regular, fontSize: 11, color: colors.textMuted },
  clientRight: { alignItems: 'flex-end', gap: 6 },
  clientOutstanding: { fontFamily: Fonts.mono.semiBold, fontSize: 12, color: Colors.warning },
});

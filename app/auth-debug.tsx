import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

export default function AuthDebugScreen() {
  const { isLoaded, isSignedIn, userId, sessionId, signOut } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const entry = `[${new Date().toISOString().slice(11, 23)}] isLoaded=${isLoaded} isSignedIn=${String(isSignedIn)} userId=${userId ?? 'null'} segments=${JSON.stringify(segments)}`;
    setLog((prev) => [entry, ...prev].slice(0, 50));
  }, [isLoaded, isSignedIn, userId, segments]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setLog((prev) => ['[SIGNED OUT]', ...prev]);
    } catch (e) {
      setLog((prev) => [`[SIGNOUT ERROR] ${e}`, ...prev]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Auth Debug</Text>

      <View style={styles.card}>
        <Row label="isLoaded" value={String(isLoaded)} />
        <Row label="isSignedIn" value={String(isSignedIn)} />
        <Row label="typeof isSignedIn" value={typeof isSignedIn} />
        <Row label="userId" value={userId ?? 'null'} />
        <Row label="sessionId" value={sessionId ?? 'null'} />
        <Row label="user email" value={user?.primaryEmailAddress?.emailAddress ?? 'null'} />
        <Row label="segments" value={JSON.stringify(segments)} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={handleSignOut}>
          <Text style={styles.btnText}>Force Sign Out</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.replace('/landing')}>
          <Text style={styles.btnText}>Go to Landing</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Go to Tabs</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.btnText}>Go to Signup</Text>
        </Pressable>
      </View>

      <Text style={styles.logTitle}>State Log (newest first)</Text>
      {log.map((entry, i) => (
        <Text key={i} style={styles.logEntry}>{entry}</Text>
      ))}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  content: { padding: Spacing.lg, paddingTop: 60 },
  title: { fontFamily: Fonts.lexend.semiBold, fontSize: 24, color: Colors.white, marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.charcoal, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.midGrey },
  label: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 13, color: Colors.lightGrey },
  value: { fontFamily: Fonts.mono.regular, fontSize: 13, color: Colors.white, maxWidth: '60%', textAlign: 'right' },
  actions: { gap: 8, marginBottom: Spacing.lg },
  btn: { backgroundColor: Colors.electricBlue, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.white },
  logTitle: { fontFamily: Fonts.sourceSans.semiBold, fontSize: 14, color: Colors.lightGrey, marginBottom: 8 },
  logEntry: { fontFamily: Fonts.mono.regular, fontSize: 11, color: Colors.lightGrey, lineHeight: 18 },
});

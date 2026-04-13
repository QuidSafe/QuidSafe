import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Shield, ArrowLeft, Home } from 'lucide-react-native';
import { colors, Colors, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <View style={styles.container}>
        <View style={styles.glow} />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Shield size={32} color={Colors.electricBlue} strokeWidth={1.5} />
          </View>

          <Text style={styles.code}>404</Text>
          <Text style={styles.title}>Page not found</Text>
          <Text style={styles.subtitle}>
            The page you&apos;re looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.replace('/landing')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go to home"
            >
              <Home size={16} color={Colors.white} strokeWidth={1.5} />
              <Text style={styles.primaryBtnText}>Go to home</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={16} color={Colors.white} strokeWidth={1.5} />
              <Text style={styles.ghostBtnText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.black,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  glow: {
    position: 'absolute' as const,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: Colors.electricBlue,
    opacity: 0.08,
  },
  content: {
    alignItems: 'center',
    maxWidth: 440,
    zIndex: 1,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  code: {
    fontFamily: Fonts.mono.semiBold,
    fontSize: 80,
    lineHeight: 80,
    color: Colors.electricBlue,
    letterSpacing: -3,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: -0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.lightGrey,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.electricBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  ghostBtnText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
  pressed: { opacity: 0.85 },
});

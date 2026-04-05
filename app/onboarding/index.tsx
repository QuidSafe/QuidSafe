import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useApiToken } from '@/lib/hooks/useApi';
import { api } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const steps = [
  {
    icon: 'shield' as const,
    iconColor: Colors.primary,
    title: 'Tax sorted. Stress gone.',
    description: 'QuidSafe tracks your sole trader income, expenses, and tax — so you always know exactly what to set aside.',
    features: [
      { icon: 'bank' as const, text: 'Auto-sync your bank transactions' },
      { icon: 'magic' as const, text: 'AI categorises income vs expenses' },
      { icon: 'calculator' as const, text: 'Real-time tax calculation' },
    ],
  },
  {
    icon: 'lock' as const,
    iconColor: Colors.secondary,
    title: 'Connect Your Bank',
    description: 'We use Open Banking (read-only) to sync your transactions. We can never move money or see your PIN.',
    features: [
      { icon: 'eye' as const, text: 'Read-only — we can never move money' },
      { icon: 'shield' as const, text: 'FCA regulated via TrueLayer' },
      { icon: 'key' as const, text: 'Bank-grade AES-256 encryption' },
    ],
  },
  {
    icon: 'check-circle' as const,
    iconColor: Colors.secondary,
    title: "You're All Set",
    description: "We'll start syncing your transactions now. This usually takes about 30 seconds — then your dashboard will light up.",
    features: [
      { icon: 'gbp' as const, text: 'See how much tax you owe instantly' },
      { icon: 'bell' as const, text: 'Get deadline reminders' },
      { icon: 'file-text-o' as const, text: 'Submit to HMRC in one tap' },
    ],
  },
];

export default function OnboardingScreen() {
  useApiToken();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (nextStep: number) => {
    Animated.timing(slideAnim, {
      toValue: -nextStep * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setStep(nextStep);
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      animateTo(step + 1);
    } else {
      await api.completeOnboarding().catch(() => {});
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await api.completeOnboarding().catch(() => {});
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}>
        {steps.map((s, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.content}>
              <View style={[styles.iconCircle, { backgroundColor: s.iconColor + '15' }]}>
                <FontAwesome name={s.icon} size={40} color={s.iconColor} />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.description}>{s.description}</Text>

              <View style={styles.features}>
                {s.features.map((f, j) => (
                  <View key={j} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <FontAwesome name={f.icon} size={16} color={Colors.secondary} />
                    </View>
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {step === 0 ? 'Connect my bank' : step === 1 ? "I'll do this later" : 'Go to Dashboard'}
          </Text>
        </Pressable>

        {step < steps.length - 1 && (
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>{step === 0 ? "I'll explore first" : 'Skip'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  slides: { flex: 1, flexDirection: 'row' },
  slide: { paddingHorizontal: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.primary, textAlign: 'center' },
  description: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 23 },
  features: { marginTop: Spacing.xl, alignSelf: 'stretch', gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary + '10', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: Colors.light.text, flex: 1 },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  dots: { flexDirection: 'row', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.grey[300] },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  button: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.button, width: '100%', alignItems: 'center', ...Shadows.soft },
  buttonText: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: Colors.white },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  skipText: { fontFamily: 'Manrope_500Medium', fontSize: 14, color: Colors.light.textSecondary },
});

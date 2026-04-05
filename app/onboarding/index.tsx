import { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

const steps = [
  {
    title: 'Welcome to QuidSafe',
    description:
      'The simplest way to track your sole trader income, expenses, and tax — all in one place.',
    icon: '🛡️',
  },
  {
    title: 'Connect Your Bank',
    description:
      'Link your business bank account and we\'ll automatically categorise your transactions using AI.',
    icon: '🏦',
  },
  {
    title: 'Know Your Tax',
    description:
      'See exactly what you owe HMRC in real-time — income tax, NI, and quarterly deadlines — in plain English.',
    icon: '📊',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const current = steps[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </Pressable>

        {step < steps.length - 1 && (
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.primary,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grey[300],
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.button,
    width: '100%',
    alignItems: 'center',
    ...Shadows.soft,
  },
  buttonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  skipText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

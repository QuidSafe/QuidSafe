import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'quidsafe_biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LocalAuth = await import('expo-local-authentication');
    const compatible = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricType(): Promise<string> {
  if (Platform.OS === 'web') return 'none';
  try {
    const LocalAuth = await import('expo-local-authentication');
    const types = await LocalAuth.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuth.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
    return 'Biometric';
  } catch {
    return 'none';
  }
}

export async function authenticate(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const LocalAuth = await import('expo-local-authentication');
    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Unlock QuidSafe',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return true; // Allow access if biometrics fails
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Silent fail
  }
}

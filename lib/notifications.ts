import { Platform } from 'react-native';
import { api } from './api';

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // Web push not supported yet

  try {
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');

    if (!Device.isDevice) return null; // Simulators can't receive push

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Register with our backend
    await api.registerDevice(token, Platform.OS);

    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushNotifications(token: string): Promise<void> {
  try {
    await api.removeDevice(token);
  } catch {
    // Silently fail — best effort cleanup
  }
}

/**
 * Get the current push notification permission status.
 * Returns 'granted', 'denied', 'undetermined', or null (web/error).
 */
export async function getNotificationPermissionStatus(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return null;
  }
}

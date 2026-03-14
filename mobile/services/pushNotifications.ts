import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from './apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  try {
    await apiClient.post('/notifications/register-device/', {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    console.error('Failed to register push token with server', err);
  }

  return token;
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

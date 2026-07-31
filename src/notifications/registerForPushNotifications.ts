import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as api from '../api/endpoints';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Recupere le token natif FCM (Android) / APNs (iOS) et l'enregistre cote backend.
 * Necessite un dev client / build EAS avec google-services.json configure — ne fonctionne pas dans Expo Go.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
  await api.registerPushToken(fcmToken, `${Platform.OS} ${Device.modelName ?? ''}`.trim());
}

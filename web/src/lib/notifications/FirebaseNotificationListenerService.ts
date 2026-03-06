import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { NotificationListenerService } from './NotificationListenerService';

export class FirebaseNotificationListenerService implements NotificationListenerService {
  async requestPermission() {
    if (!messaging) return null;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' });
        return token;
      }
      return null;
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      return null;
    }
  }

  onMessageReceived(callback: (payload: any) => void) {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
}

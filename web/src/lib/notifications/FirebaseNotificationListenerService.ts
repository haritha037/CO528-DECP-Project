import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { AppNotification, NotificationListenerService } from './NotificationListenerService';

export class FirebaseNotificationListenerService implements NotificationListenerService {
  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): () => void {
    const notifRef = ref(db, `notifications/${userId}`);

    const unsubscribe = onValue(notifRef, (snapshot) => {
      const notifications: AppNotification[] = [];
      snapshot.forEach((child) => {
        const val = child.val();
        notifications.push({
          id:        child.key as string,
          type:      val.type      ?? '',
          title:     val.title     ?? '',
          message:   val.message   ?? '',
          data:      val.data      ?? {},
          read:      val.read      ?? false,
          createdAt: val.createdAt ?? 0,
        });
      });
      // Sort newest first
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      callback(notifications);
    });

    return unsubscribe;
  }

  markAsRead(userId: string, notificationId: string): void {
    const readRef = ref(db, `notifications/${userId}/${notificationId}/read`);
    set(readRef, true).catch(console.error);
  }

  markAllAsRead(userId: string, notificationIds: string[]): void {
    notificationIds.forEach(id => {
      const readRef = ref(db, `notifications/${userId}/${id}/read`);
      set(readRef, true).catch(console.error);
    });
  }
}

export type { AppNotification, NotificationListenerService } from './NotificationListenerService';
export { FirebaseNotificationListenerService } from './FirebaseNotificationListenerService';

import { FirebaseNotificationListenerService } from './FirebaseNotificationListenerService';
export const notificationListenerService = new FirebaseNotificationListenerService();

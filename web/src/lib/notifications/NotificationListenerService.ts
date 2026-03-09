export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, string>;
  read: boolean;
  createdAt: number;
}

export interface NotificationListenerService {
  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): () => void;

  markAsRead(userId: string, notificationId: string): void;
  markAllAsRead(userId: string, notificationIds: string[]): void;
}

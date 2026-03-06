export interface NotificationListenerService {
  requestPermission(): Promise<string | null>;
  onMessageReceived(callback: (payload: any) => void): void;
}

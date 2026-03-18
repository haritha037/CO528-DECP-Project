import apiClient from './apiClient';

export const notificationApi = {
  getNotifications: (page = 0, size = 20) =>
    apiClient.get('/api/notifications', { params: { page, size } }).then(r => r.data as Record<string, unknown>[]),

  getUnreadCount: () =>
    apiClient.get('/api/notifications/unread-count').then(r => (r.data as { count: number }).count),

  markRead: (id: string) =>
    apiClient.put(`/api/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.put('/api/notifications/read-all'),
};

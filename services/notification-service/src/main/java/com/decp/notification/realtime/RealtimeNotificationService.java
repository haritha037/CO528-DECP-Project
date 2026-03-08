package com.decp.notification.realtime;

import com.decp.notification.model.NotificationPayload;

public interface RealtimeNotificationService {

    /**
     * Writes a notification to Firebase RTDB under notifications/{userId}/{newKey}.
     */
    void sendNotification(String userId, NotificationPayload payload);
}

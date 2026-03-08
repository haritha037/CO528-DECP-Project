package com.decp.notification.realtime;

import com.decp.notification.model.NotificationPayload;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class FirebaseRealtimeNotificationService implements RealtimeNotificationService {

    @Override
    public void sendNotification(String userId, NotificationPayload payload) {
        try {
            DatabaseReference ref = FirebaseDatabase.getInstance()
                    .getReference("notifications/" + userId)
                    .push();

            Map<String, Object> data = new HashMap<>();
            data.put("type",      payload.getType());
            data.put("title",     payload.getTitle());
            data.put("message",   payload.getMessage());
            data.put("data",      payload.getData() != null ? payload.getData() : Map.of());
            data.put("read",      false);
            data.put("createdAt", payload.getCreatedAt());

            ref.setValueAsync(data);
        } catch (Exception e) {
            log.error("Failed to write notification to Firebase RTDB for user {}: {}", userId, e.getMessage());
        }
    }
}

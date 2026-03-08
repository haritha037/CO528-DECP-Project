package com.decp.notification.service;

import com.google.firebase.database.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class NotificationService {

    /**
     * Returns all notifications for a user sorted by createdAt descending.
     * Reads from Firebase RTDB synchronously (with a timeout).
     */
    public List<Map<String, Object>> getNotifications(String userId, int page, int size) {
        List<Map<String, Object>> results = new ArrayList<>();
        CountDownLatch latch = new CountDownLatch(1);

        DatabaseReference ref = FirebaseDatabase.getInstance()
                .getReference("notifications/" + userId);

        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                for (DataSnapshot child : snapshot.getChildren()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", child.getKey());
                    item.putAll((Map<String, Object>) child.getValue(Map.class));
                    results.add(item);
                }
                latch.countDown();
            }

            @Override
            public void onCancelled(DatabaseError error) {
                log.error("Firebase read cancelled: {}", error.getMessage());
                latch.countDown();
            }
        });

        try {
            latch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Sort by createdAt descending
        results.sort((a, b) -> {
            long ca = toLong(a.get("createdAt"));
            long cb = toLong(b.get("createdAt"));
            return Long.compare(cb, ca);
        });

        // Paginate
        int from = page * size;
        int to   = Math.min(from + size, results.size());
        if (from >= results.size()) return List.of();
        return results.subList(from, to);
    }

    /**
     * Returns the count of unread notifications for a user.
     */
    public long getUnreadCount(String userId) {
        List<Map<String, Object>> all = getNotifications(userId, 0, Integer.MAX_VALUE);
        return all.stream()
                .filter(n -> !Boolean.TRUE.equals(n.get("read")))
                .count();
    }

    /**
     * Marks a single notification as read.
     */
    public void markRead(String userId, String notificationId) {
        FirebaseDatabase.getInstance()
                .getReference("notifications/" + userId + "/" + notificationId + "/read")
                .setValueAsync(true);
    }

    /**
     * Marks all notifications for a user as read.
     */
    public void markAllRead(String userId) {
        List<Map<String, Object>> all = getNotifications(userId, 0, Integer.MAX_VALUE);
        DatabaseReference userRef = FirebaseDatabase.getInstance()
                .getReference("notifications/" + userId);
        for (Map<String, Object> n : all) {
            String id = (String) n.get("id");
            if (id != null && !Boolean.TRUE.equals(n.get("read"))) {
                userRef.child(id).child("read").setValueAsync(true);
            }
        }
    }

    private long toLong(Object val) {
        if (val instanceof Long l) return l;
        if (val instanceof Integer i) return i.longValue();
        if (val instanceof Number num) return num.longValue();
        return 0L;
    }
}

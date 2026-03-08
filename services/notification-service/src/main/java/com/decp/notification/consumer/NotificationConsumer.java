package com.decp.notification.consumer;

import com.decp.notification.client.UserServiceClient;
import com.decp.notification.model.NotificationPayload;
import com.decp.notification.realtime.RealtimeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final RealtimeNotificationService realtimeService;
    private final UserServiceClient userServiceClient;

    @RabbitListener(queues = "notification-queue")
    public void handle(Map<String, Object> message) {
        try {
            String type = (String) message.get("type");
            if (type == null) {
                log.warn("Received notification message without 'type' field, skipping");
                return;
            }

            switch (type) {
                case "POST_REACTED"    -> handlePostNotification(message, type);
                case "POST_COMMENTED"  -> handlePostNotification(message, type);
                case "COMMENT_REPLIED" -> handlePostNotification(message, type);
                case "NEW_EVENT"       -> handleEventCreated(message);
                case "JOB_POSTED"      -> handleJobPosted(message);
                default -> log.warn("Unknown notification type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing notification message: {}", e.getMessage(), e);
        }
    }

    // ── Direct (single recipient) notifications ───────────────────────────────

    private void handlePostNotification(Map<String, Object> message, String type) {
        String recipientId     = (String) message.get("recipientId");
        String triggeredByName = (String) message.getOrDefault("triggeredByName", "Someone");
        String postId          = (String) message.get("postId");
        String commentId       = (String) message.get("commentId");

        if (recipientId == null) {
            log.warn("Post notification missing recipientId, skipping");
            return;
        }

        String title   = buildTitle(type);
        String body    = buildBody(type, triggeredByName);

        NotificationPayload payload = NotificationPayload.builder()
                .type(type)
                .title(title)
                .message(body)
                .data(buildData(postId, commentId, null, null,
                        (String) message.get("triggeredById")))
                .build();

        realtimeService.sendNotification(recipientId, payload);
        log.debug("Sent {} notification to user {}", type, recipientId);
    }

    // ── Broadcast notifications ───────────────────────────────────────────────

    private void handleEventCreated(Map<String, Object> message) {
        String eventId     = (String) message.get("eventId");
        String title       = (String) message.getOrDefault("title", "New Event");
        String createdById = (String) message.get("createdById");

        NotificationPayload payload = NotificationPayload.builder()
                .type("NEW_EVENT")
                .title("New Event: " + title)
                .message("A new event has been posted: " + title)
                .data(buildData(null, null, eventId, null, createdById))
                .build();

        broadcastToAllUsers(payload, createdById);
    }

    private void handleJobPosted(Map<String, Object> message) {
        String jobId      = (String) message.get("jobId");
        String title      = (String) message.getOrDefault("title", "New Job");
        String company    = (String) message.getOrDefault("company", "");
        String postedById = (String) message.get("postedById");

        NotificationPayload payload = NotificationPayload.builder()
                .type("JOB_POSTED")
                .title("New Job: " + title)
                .message(title + " at " + company + " has been posted")
                .data(buildData(null, null, null, jobId, postedById))
                .build();

        broadcastToAllUsers(payload, postedById);
    }

    @SuppressWarnings("unchecked")
    private void broadcastToAllUsers(NotificationPayload payload, String excludeUserId) {
        try {
            Map<String, Object> page = userServiceClient.getAllUsers(0, 500);
            List<Map<String, Object>> users = (List<Map<String, Object>>) page.get("content");
            if (users == null) return;

            for (Map<String, Object> user : users) {
                String firebaseUid = (String) user.get("firebaseUid");
                if (firebaseUid == null || firebaseUid.equals(excludeUserId)) continue;
                realtimeService.sendNotification(firebaseUid, payload);
            }
            log.info("Broadcast {} notification to {} users", payload.getType(), users.size());
        } catch (Exception e) {
            log.error("Failed to broadcast {} notification: {}", payload.getType(), e.getMessage(), e);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String buildTitle(String type) {
        return switch (type) {
            case "POST_REACTED"    -> "New reaction on your post";
            case "POST_COMMENTED"  -> "New comment on your post";
            case "COMMENT_REPLIED" -> "New reply to your comment";
            default -> "New notification";
        };
    }

    private String buildBody(String type, String actorName) {
        return switch (type) {
            case "POST_REACTED"    -> actorName + " reacted to your post";
            case "POST_COMMENTED"  -> actorName + " commented on your post";
            case "COMMENT_REPLIED" -> actorName + " replied to your comment";
            default -> "You have a new notification";
        };
    }

    private Map<String, String> buildData(String postId, String commentId,
                                           String eventId, String jobId,
                                           String triggeredById) {
        var data = new java.util.HashMap<String, String>();
        if (postId      != null) data.put("postId",      postId);
        if (commentId   != null) data.put("commentId",   commentId);
        if (eventId     != null) data.put("eventId",     eventId);
        if (jobId       != null) data.put("jobId",       jobId);
        if (triggeredById != null) data.put("triggeredById", triggeredById);
        return data;
    }
}

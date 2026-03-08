package com.decp.post.messaging;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationEvent {
    private String type;           // POST_REACTED, POST_COMMENTED, COMMENT_REPLIED
    private String recipientId;    // Firebase UID of the notification recipient
    private String triggeredById;  // Firebase UID of the user who triggered the action
    private String triggeredByName;
    private String postId;
    private String commentId;      // null for reactions
    private LocalDateTime timestamp;
}

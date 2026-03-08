package com.decp.notification.model;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class NotificationPayload {

    private String type;
    private String title;
    private String message;
    private Map<String, String> data;

    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private long createdAt = System.currentTimeMillis();
}

package com.decp.post.client;

import lombok.Data;

@Data
public class UserDTO {
    private String firebaseUid;
    private String name;
    private String profilePictureUrl;
    private String role;
    private String roleBadge;
    private String initials;
}

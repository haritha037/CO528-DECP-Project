package com.decp.post.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthorDTO {
    private String firebaseUid;
    private String name;
    private String profilePictureUrl;
    private String role;
    private String roleBadge;
    private String initials;
}

package com.decp.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String firebaseUid;
    private String email;
    private String name;
    private String bio;
    private String department;
    private Integer graduationYear;
    private String profilePictureUrl;
    private String role;        // "STUDENT", "ALUMNI", "ADMIN"
    private String roleBadge;   // "blue", "gold", "red"
    private String linkedinUrl;
    private String githubUrl;
    private String initials;    // computed: "HB" for "Haritha Bandara"
    private boolean profileComplete;
}

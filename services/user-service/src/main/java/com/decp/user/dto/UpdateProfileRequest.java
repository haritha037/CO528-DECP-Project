package com.decp.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String bio;
    private String department;
    private String batch;
    private String profilePictureUrl;
    private String linkedinUrl;
    private String githubUrl;
}

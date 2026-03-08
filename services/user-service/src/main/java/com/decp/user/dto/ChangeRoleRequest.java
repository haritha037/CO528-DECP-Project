package com.decp.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangeRoleRequest {

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "STUDENT|ALUMNI|ADMIN", message = "Role must be STUDENT, ALUMNI, or ADMIN")
    private String role;
}

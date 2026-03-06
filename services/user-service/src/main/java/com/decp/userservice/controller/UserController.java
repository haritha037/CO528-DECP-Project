package com.decp.userservice.controller;

import com.decp.userservice.dto.RegisterUserRequest;
import com.decp.userservice.identity.IdentityProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final IdentityProviderService identityProviderService;
    // private final UserService userService; // Will be implemented in Phase 3

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody RegisterUserRequest request) {
        log.info("Admin requesting to register new user: {}", request.getEmail());
        
        try {
            // 1. Create user in Identity Provider (Firebase)
            String uid = identityProviderService.createUser(
                    request.getEmail(), 
                    request.getPassword(), 
                    request.getName()
            );

            // 2. Set custom claims (role) in Identity Provider
            identityProviderService.setCustomUserClaims(uid, request.getRole());

            // 3. Save user to database
            // Temporarily commented out until Phase 3 where we build the UserService and Entity
            // userService.createUserProfile(uid, request);

            log.info("Successfully registered user {} with role {}", request.getEmail(), request.getRole());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "User registered successfully",
                    "uid", uid
            ));
        } catch (Exception e) {
            log.error("Failed to register user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to register user: " + e.getMessage()
            ));
        }
    }
    
    // Stub profile setup endpoint since the frontend calls it during login
    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(@RequestBody Object profileData) {
        // Will be implemented in Phase 3
        return ResponseEntity.ok(Map.of("message", "Profile updated (stub)"));
    }
    
    @PutMapping("/profile/complete")
    public ResponseEntity<Map<String, String>> completeProfile() {
        // Will be implemented in Phase 3
        return ResponseEntity.ok(Map.of("message", "Profile completed (stub)"));
    }
}

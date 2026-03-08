package com.decp.user.controller;

import com.decp.user.dto.ChangeRoleRequest;
import com.decp.user.dto.RegisterUserRequest;
import com.decp.user.dto.UpdateProfileRequest;
import com.decp.user.dto.UserDTO;
import com.decp.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    private final UserService userService;

    // ── Admin: create user ───────────────────────────────────────────────────

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> registerUser(@Valid @RequestBody RegisterUserRequest request) {
        log.info("Admin registering new user: {}", request.getEmail());
        UserDTO created = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── Own profile ──────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getMyProfile(
            @RequestHeader("X-User-Id") String firebaseUid) {
        return ResponseEntity.ok(userService.getMyProfile(firebaseUid));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @RequestHeader("X-User-Id") String firebaseUid,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(firebaseUid, request));
    }

    @PutMapping("/profile/complete")
    public ResponseEntity<UserDTO> completeProfile(
            @RequestHeader("X-User-Id") String firebaseUid) {
        return ResponseEntity.ok(userService.completeProfile(firebaseUid));
    }

    @PostMapping("/profile/sync-claims")
    public ResponseEntity<Void> syncMyClaims(
            @RequestHeader("X-User-Id") String firebaseUid) {
        userService.syncMyClaims(firebaseUid);
        return ResponseEntity.ok().build();
    }

    // ── User directory & search ──────────────────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<Page<UserDTO>> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return ResponseEntity.ok(userService.searchUsers(q, role, department, pageable));
    }

    @GetMapping("/{firebaseUid}")
    public ResponseEntity<UserDTO> getUserByFirebaseUid(@PathVariable String firebaseUid) {
        return ResponseEntity.ok(userService.getUserByFirebaseUid(firebaseUid));
    }

    // ── Admin: list all users ────────────────────────────────────────────────

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    // ── Admin: change role ───────────────────────────────────────────────────

    @PutMapping("/{firebaseUid}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> changeUserRole(
            @PathVariable String firebaseUid,
            @Valid @RequestBody ChangeRoleRequest request) {
        log.info("Admin changing role of {} to {}", firebaseUid, request.getRole());
        return ResponseEntity.ok(userService.changeUserRole(firebaseUid, request));
    }

    // ── Stats placeholder (Phase 9) ──────────────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Object> getStats() {
        return ResponseEntity.ok(Map.of("message", "Stats endpoint — implemented in Phase 9"));
    }
}

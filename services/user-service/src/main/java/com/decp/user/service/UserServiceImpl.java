package com.decp.user.service;

import com.decp.user.dto.ChangeRoleRequest;
import com.decp.user.dto.RegisterUserRequest;
import com.decp.user.dto.UpdateProfileRequest;
import com.decp.user.dto.UserDTO;
import com.decp.user.entity.User;
import com.decp.user.identity.IdentityProviderService;
import com.decp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final IdentityProviderService identityProviderService;

    @Override
    @Transactional
    public UserDTO registerUser(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String uid = null;
        try {
            // Step 1: create in Firebase Auth
            uid = identityProviderService.createUser(
                    request.getEmail(), request.getPassword(), request.getName());

            // Step 2: set role as custom claim
            identityProviderService.setCustomUserClaims(uid, request.getRole());

            // Step 3: persist to PostgreSQL
            User user = new User();
            user.setFirebaseUid(uid);
            user.setEmail(request.getEmail());
            user.setName(request.getName());
            user.setRole(request.getRole());
            user.setDepartment(request.getDepartment());
            user.setProfileComplete(false);

            return mapToDTO(userRepository.save(user));

        } catch (Exception e) {
            // Rollback: delete the Firebase user if DB save failed
            if (uid != null) {
                try {
                    identityProviderService.deleteUser(uid);
                    log.warn("Rolled back Firebase user creation for uid={}", uid);
                } catch (Exception rollbackEx) {
                    log.error("Failed to rollback Firebase user uid={}: {}", uid, rollbackEx.getMessage());
                }
            }
            throw e;
        }
    }

    @Override
    public UserDTO getMyProfile(String firebaseUid) {
        User user = findByFirebaseUid(firebaseUid);
        return mapToDTO(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(String firebaseUid, UpdateProfileRequest request) {
        User user = findByFirebaseUid(firebaseUid);
        user.setName(request.getName());
        user.setBio(request.getBio());
        user.setDepartment(request.getDepartment());
        user.setBatch(request.getBatch());
        user.setProfilePictureUrl(request.getProfilePictureUrl());
        user.setLinkedinUrl(request.getLinkedinUrl());
        user.setGithubUrl(request.getGithubUrl());
        return mapToDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDTO completeProfile(String firebaseUid) {
        User user = findByFirebaseUid(firebaseUid);
        user.setProfileComplete(true);
        return mapToDTO(userRepository.save(user));
    }

    @Override
    public UserDTO getUserByFirebaseUid(String firebaseUid) {
        User user = findByFirebaseUid(firebaseUid);
        return mapToDTO(user);
    }

    @Override
    public Page<UserDTO> searchUsers(String q, String role, String department, Pageable pageable) {
        String qParam = (q != null && q.isBlank()) ? null : q;
        String roleParam = (role != null && role.isBlank()) ? null : role;
        String deptParam = (department != null && department.isBlank()) ? null : department;
        return userRepository.searchUsers(qParam, roleParam, deptParam, pageable).map(this::mapToDTO);
    }

    @Override
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public UserDTO changeUserRole(String firebaseUid, ChangeRoleRequest request) {
        User user = findByFirebaseUid(firebaseUid);
        // Update Firebase custom claims first (if this fails, we don't update DB)
        identityProviderService.setCustomUserClaims(firebaseUid, request.getRole());
        user.setRole(request.getRole());
        return mapToDTO(userRepository.save(user));
    }

    @Override
    public void syncMyClaims(String firebaseUid) {
        User user = findByFirebaseUid(firebaseUid);
        identityProviderService.setCustomUserClaims(firebaseUid, user.getRole());
        log.info("Synced Firebase claims for uid={} role={}", firebaseUid, user.getRole());
    }

    @Override
    public Map<String, Object> getStats() {
        return Map.of(
            "totalUsers",      userRepository.count(),
            "students",        userRepository.countByRole("STUDENT"),
            "alumni",          userRepository.countByRole("ALUMNI"),
            "admins",          userRepository.countByRole("ADMIN"),
            "profileComplete", userRepository.countByProfileCompleteTrue()
        );
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private User findByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found: " + firebaseUid));
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId().toString())
                .firebaseUid(user.getFirebaseUid())
                .email(user.getEmail())
                .name(user.getName())
                .bio(user.getBio())
                .department(user.getDepartment())
                .batch(user.getBatch())
                .profilePictureUrl(user.getProfilePictureUrl())
                .role(user.getRole())
                .roleBadge(roleBadge(user.getRole()))
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .initials(initials(user.getName()))
                .profileComplete(user.isProfileComplete())
                .build();
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) return "?";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (String.valueOf(parts[0].charAt(0)) + String.valueOf(parts[parts.length - 1].charAt(0))).toUpperCase();
    }

    private String roleBadge(String role) {
        return switch (role) {
            case "ALUMNI" -> "gold";
            case "ADMIN"  -> "red";
            default       -> "blue";  // STUDENT
        };
    }
}

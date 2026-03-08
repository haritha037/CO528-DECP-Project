package com.decp.user.service;

import com.decp.user.dto.ChangeRoleRequest;
import com.decp.user.dto.RegisterUserRequest;
import com.decp.user.dto.UpdateProfileRequest;
import com.decp.user.dto.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface UserService {
    UserDTO registerUser(RegisterUserRequest request);
    UserDTO getMyProfile(String firebaseUid);
    UserDTO updateProfile(String firebaseUid, UpdateProfileRequest request);
    UserDTO completeProfile(String firebaseUid);
    UserDTO getUserByFirebaseUid(String firebaseUid);
    Page<UserDTO> searchUsers(String q, String role, String department, Pageable pageable);
    Page<UserDTO> getAllUsers(Pageable pageable);
    UserDTO changeUserRole(String firebaseUid, ChangeRoleRequest request);
    void syncMyClaims(String firebaseUid);
    Map<String, Object> getStats();
}

package com.decp.user.service;

import com.decp.user.dto.UserDTO;
import com.decp.user.entity.User;
import com.decp.user.identity.IdentityProviderService;
import com.decp.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private IdentityProviderService identityProviderService;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void getMyProfile_returnsUserDTO_whenUserExists() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFirebaseUid("uid-123");
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setRole("STUDENT");

        when(userRepository.findByFirebaseUid("uid-123")).thenReturn(Optional.of(user));

        UserDTO result = userService.getMyProfile("uid-123");

        assertEquals("test@example.com", result.getEmail());
        assertEquals("Test User", result.getName());
        assertEquals("STUDENT", result.getRole());
        assertEquals("blue", result.getRoleBadge());
        assertEquals("TU", result.getInitials());
    }

    @Test
    void getMyProfile_throwsNotFound_whenUserDoesNotExist() {
        when(userRepository.findByFirebaseUid("missing-uid")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> userService.getMyProfile("missing-uid"));
    }
}

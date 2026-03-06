package com.decp.userservice.identity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class FirebaseIdentityProviderService implements IdentityProviderService {

    @Override
    public String createUser(String email, String password, String name) {
        try {
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password)
                    .setDisplayName(name)
                    .setEmailVerified(true);

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
            log.info("Successfully created new Firebase user: {}", userRecord.getUid());
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            log.error("Error creating Firebase user: {}", e.getMessage());
            throw new RuntimeException("Failed to create identity provider record: " + e.getMessage(), e);
        }
    }

    @Override
    public void setCustomUserClaims(String uid, String role) {
        try {
            Map<String, Object> claims = Map.of("role", role);
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
            log.info("Successfully set custom claims for user {}: {}", uid, claims);
        } catch (FirebaseAuthException e) {
            log.error("Error setting custom claims for Firebase user: {}", e.getMessage());
            throw new RuntimeException("Failed to set user roles in identity provider: " + e.getMessage(), e);
        }
    }
}

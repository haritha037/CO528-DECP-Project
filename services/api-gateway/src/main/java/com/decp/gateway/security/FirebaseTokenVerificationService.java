package com.decp.gateway.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FirebaseTokenVerificationService implements TokenVerificationService {

    @Override
    public DecodedToken verifyToken(String token) {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            return new FirebaseDecodedToken(decodedToken);
        } catch (FirebaseAuthException e) {
            log.warn("Invalid Firebase token: {}", e.getMessage());
            return null; // Gateway filter will handle null and return 401
        } catch (Exception e) {
            log.error("Error verifying Firebase token: {}", e.getMessage(), e);
            return null;
        }
    }

    private static class FirebaseDecodedToken implements DecodedToken {
        private final FirebaseToken token;

        public FirebaseDecodedToken(FirebaseToken token) {
            this.token = token;
        }

        @Override
        public String getUid() {
            return token.getUid();
        }

        @Override
        public String getEmail() {
            return token.getEmail();
        }

        @Override
        public String getRole() {
            // Role is stored as a custom claim "role"
            Object role = token.getClaims().get("role");
            return role != null ? role.toString() : "STUDENT"; // Default fallback
        }
    }
}

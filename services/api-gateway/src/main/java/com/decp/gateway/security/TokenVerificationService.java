package com.decp.gateway.security;

import org.springframework.stereotype.Service;

public interface TokenVerificationService {
    DecodedToken verifyToken(String token);
    
    // We define a simple interface for the decoded token to decouple from Firebase classes everywhere
    interface DecodedToken {
        String getUid();
        String getEmail();
        String getRole();
    }
}

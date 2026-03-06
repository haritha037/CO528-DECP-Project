package com.decp.userservice.identity;

public interface IdentityProviderService {
    String createUser(String email, String password, String name);
    void setCustomUserClaims(String uid, String role);
}

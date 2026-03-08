package com.decp.post.config;

import com.decp.post.security.UserPrincipal;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
public class FeignConfig {

    /**
     * Propagates X-User-Id / X-User-Email / X-User-Role to downstream Feign calls.
     * Without this the Post Service's direct call to User Service arrives with no
     * authentication headers and is rejected with 403.
     */
    @Bean
    RequestInterceptor forwardAuthHeadersInterceptor() {
        return template -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                template.header("X-User-Id", principal.getId());
                if (principal.getEmail() != null) {
                    template.header("X-User-Email", principal.getEmail());
                }
                if (principal.getRole() != null) {
                    template.header("X-User-Role", principal.getRole());
                }
            }
        };
    }
}

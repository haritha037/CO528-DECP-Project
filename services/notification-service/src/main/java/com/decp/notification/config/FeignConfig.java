package com.decp.notification.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Adds synthetic gateway headers to all Feign requests so downstream services
 * treat notification-service as a trusted internal ADMIN caller.
 */
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor internalServiceHeaderInterceptor() {
        return template -> {
            template.header("X-User-Id",    "notification-service");
            template.header("X-User-Email", "internal@decp.system");
            template.header("X-User-Role",  "ADMIN");
        };
    }
}

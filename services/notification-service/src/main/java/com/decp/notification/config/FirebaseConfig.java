package com.decp.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class FirebaseConfig {

    // Preferred: JSON content injected as env var (used in k8s/Docker deployments)
    @Value("${FIREBASE_SERVICE_ACCOUNT_JSON:}")
    private String serviceAccountJson;

    // Fallback: classpath file (used for local Spring Boot and Docker Compose builds)
    @Value("${firebase.service-account-path}")
    private Resource serviceAccountResource;

    @Value("${firebase.database-url}")
    private String databaseUrl;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream credentialsStream;
                if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
                    log.info("Firebase: loading credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var");
                    credentialsStream = new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8));
                } else {
                    log.info("Firebase: loading credentials from classpath file");
                    credentialsStream = serviceAccountResource.getInputStream();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(credentialsStream))
                        .setDatabaseUrl(databaseUrl)
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized in Notification Service (RTDB: {})", databaseUrl);
            }
        } catch (IOException e) {
            log.error("Could not initialize Firebase in Notification Service: {}", e.getMessage(), e);
        }
    }
}

package com.dumpspace.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    @PostConstruct
    public void init() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return;
            }

            GoogleCredentials credentials;
            if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                try (FileInputStream in = new FileInputStream(serviceAccountPath)) {
                    credentials = GoogleCredentials.fromStream(in);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
            FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            System.err.println("Firebase Admin not initialized: " + e.getMessage());
        }
    }
}

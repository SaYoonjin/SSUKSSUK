package com.ssukssuk.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_CREDENTIALS_PATH:}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        InputStream serviceAccount;

        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            Path path = Paths.get(credentialsPath);
            if (Files.exists(path)) {
                serviceAccount = new FileInputStream(credentialsPath);
            } else {
                throw new IOException("Firebase credentials file not found: " + credentialsPath);
            }
        } else {
            serviceAccount = new ClassPathResource("ssukssuk-f61a6-firebase-adminsdk-fbsvc-d1999289cd.json").getInputStream();
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        return FirebaseApp.initializeApp(options);
    }
}
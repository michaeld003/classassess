package com.classassess.classassess.service;

import com.classassess.classassess.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    private final ConcurrentHashMap<String, Long> activeSessions = new ConcurrentHashMap<>();

    @Autowired
    private JwtService jwtService;

    public void recordSession(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            try {
                String username = jwtService.extractUsername(jwt);
                if (username != null) {
                    activeSessions.put(username, System.currentTimeMillis());
                }
            } catch (Exception e) {
                // Invalid token, ignore
            }
        }
    }

    public void removeSession(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            try {
                String username = jwtService.extractUsername(jwt);
                if (username != null) {
                    activeSessions.remove(username);
                }
            } catch (Exception e) {
                // Invalid token, ignore
            }
        }
    }

    public int getActiveSessionCount() {
        // Remove sessions older than 30 minutes
        long thirtyMinutesAgo = System.currentTimeMillis() - (30 * 60 * 1000);
        activeSessions.entrySet().removeIf(entry -> entry.getValue() < thirtyMinutesAgo);

        return activeSessions.size();
    }

    // For testing/demo purposes
    public void setActiveSessionCount(int count) {
        // Clear existing sessions
        activeSessions.clear();

        // Add dummy sessions
        for (int i = 0; i < count; i++) {
            activeSessions.put("user" + i + "@example.com", System.currentTimeMillis());
        }
    }
}
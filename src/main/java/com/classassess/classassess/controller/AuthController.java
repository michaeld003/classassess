package com.classassess.classassess.controller;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            log.info("Received registration request for email: {}", request.getEmail());
            AuthResponse response = authService.register(request);
            log.info("Successfully registered user with email: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Registration failed for email: {}", request.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Received login request for email: {}", request.getEmail());
            AuthResponse response = authService.login(request);
            log.info("Successfully logged in user with email: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed for email: {}", request.getEmail(), e);
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<AuthResponse> getProfile() {
        try {
            AuthResponse response = authService.getCurrentUserProfile();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get profile", e);
            throw e;
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDTO request) {
        try {
            log.info("Received password reset request for email: {}", request.getEmail());
            authService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully"));
        } catch (Exception e) {
            log.error("Password reset request failed for email: {}", request.getEmail(), e);
            // Don't expose whether the email exists or not for security reasons
            return ResponseEntity.ok(Map.of("message", "If your email exists in our system, you will receive a password reset link"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetDTO request) {
        try {
            log.info("Received password reset confirmation");
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
        } catch (Exception e) {
            log.error("Password reset failed", e);
            throw new RuntimeException("Password reset failed: " + e.getMessage());
        }
    }

    @GetMapping("/validate-reset-token/{token}")
    public ResponseEntity<?> validateResetToken(@PathVariable String token) {
        try {
            boolean isValid = authService.validatePasswordResetToken(token);
            return ResponseEntity.ok(Map.of("valid", isValid));
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return ResponseEntity.ok(Map.of("valid", false));
        }
    }
}
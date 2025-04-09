package com.classassess.classassess.service;

import com.classassess.classassess.dto.AuthResponse;
import com.classassess.classassess.dto.LoginRequest;
import com.classassess.classassess.dto.RegisterRequest;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.Role;
import com.classassess.classassess.model.User;
import com.classassess.classassess.repository.ModuleRepository;
import com.classassess.classassess.repository.UserRepository;
import com.classassess.classassess.repository.ModuleStudentRepository;
import com.classassess.classassess.model.ModuleStudent;
import com.classassess.classassess.security.JwtService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final ModuleStudentRepository moduleStudentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final NotificationService notificationService;


    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getSelectedModules().size() != 3) {
            throw new RuntimeException("Please select exactly 3 modules");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        var user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.STUDENT)
                .phoneNumber(request.getPhoneNumber())
                .department(request.getDepartment())
                .isEnabled(true)
                .isAccountNonLocked(true)
                // Set initial account status as PENDING
                .accountStatus(User.AccountStatus.PENDING)
                .build();

        userRepository.save(user);
        emailService.sendRegistrationAcknowledgmentEmail(user.getEmail(), user.getFullName());
        notificationService.handleNewRegistrationNotification(user);

        request.getSelectedModules().forEach(moduleCode -> {
            var module = moduleRepository.findByCode(moduleCode)
                    .orElseThrow(() -> new RuntimeException("Module not found: " + moduleCode));
            moduleStudentRepository.save(new ModuleStudent(module, user));
        });

        // For pending accounts, don't generate a token
        return AuthResponse.builder()
                .email(user.getEmail())
                .role("STUDENT")
                .fullName(user.getFullName())
                .accountStatus(User.AccountStatus.PENDING.name())
                .requiresApproval(true)
                .message("Your account has been registered and is pending approval.")
                .build();
    }

    // Create a new method for approving/rejecting accounts
    @Transactional
    public void updateAccountStatus(Long userId, User.AccountStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User.AccountStatus oldStatus = user.getAccountStatus();
        user.setAccountStatus(status);
        userRepository.save(user);

        // Trigger notification on approval or rejection
        if (status == User.AccountStatus.APPROVED || status == User.AccountStatus.REJECTED) {
            boolean isApproved = (status == User.AccountStatus.APPROVED);
            notificationService.handleAccountApprovalNotification(user, isApproved);
        }
    }

    public AuthResponse login(LoginRequest request) {
        try {
            // First check if the user exists
            Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
            if (userOptional.isEmpty()) {
                throw new BadCredentialsException("Invalid email or password");
            }

            User user = userOptional.get();

            // Check account status before attempting authentication
            if (user.getAccountStatus() == User.AccountStatus.PENDING) {
                return AuthResponse.builder()
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .fullName(user.getFullName())
                        .accountStatus(User.AccountStatus.PENDING.name())
                        .requiresApproval(true)
                        .message("Your account is pending approval. Please check back later.")
                        .build(); // No token set for pending accounts
            } else if (user.getAccountStatus() == User.AccountStatus.REJECTED) {
                return AuthResponse.builder()
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .fullName(user.getFullName())
                        .accountStatus(User.AccountStatus.REJECTED.name())
                        .requiresApproval(false)
                        .message("Your account has been rejected. Please contact an administrator.")
                        .build(); // No token set for rejected accounts
            } else if (user.getAccountStatus() == User.AccountStatus.SUSPENDED) {
                return AuthResponse.builder()
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .fullName(user.getFullName())
                        .accountStatus(User.AccountStatus.SUSPENDED.name())
                        .requiresApproval(false)
                        .message("Your account has been suspended. Please contact an administrator.")
                        .build(); // No token set for suspended accounts
            }

            // Now attempt authentication for approved accounts
            try {
                Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
                );
            } catch (BadCredentialsException e) {
                throw new BadCredentialsException("Invalid email or password");
            }

            // Only generate token for approved accounts
            var token = jwtService.generateToken(user);

            return AuthResponse.builder()
                    .token(token) // Token only set for approved accounts
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .fullName(user.getFullName())
                    .accountStatus(User.AccountStatus.APPROVED.name())
                    .requiresApproval(false)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
    }

    public AuthResponse getCurrentUserProfile() {
        var user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return AuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    @PostConstruct
    public void init() {
        String testPassword = "password123";
        String hashedPassword = passwordEncoder.encode(testPassword);
        System.out.println("Test password hash for 'password123': " + hashedPassword);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a password reset token (valid for a shorter time than regular auth tokens)
        String token = jwtService.generatePasswordResetToken(user);

        // Store the token in the user record
        user.setResetToken(token);
        user.setResetTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 hour expiry
        userRepository.save(user);

        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Validate token
        if (!validatePasswordResetToken(token)) {
            throw new RuntimeException("Invalid or expired token");
        }

        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));

        // Clear reset token
        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
    }

    public boolean validatePasswordResetToken(String token) {
        try {
            // First check if token is syntactically valid
            if (!jwtService.validateToken(token)) {
                return false;
            }

            // Extract email from token
            String email = jwtService.extractUsername(token);
            if (email == null) {
                return false;
            }

            // Verify user exists and token matches
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return false;
            }

            User user = userOpt.get();

            // Check if stored token matches and hasn't expired
            return token.equals(user.getResetToken()) &&
                    user.getResetTokenExpiry() != null &&
                    user.getResetTokenExpiry().after(new Date());

        } catch (Exception e) {
            return false;
        }
    }
}
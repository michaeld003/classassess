package com.classassess.classassess.service;

import com.classassess.classassess.model.Role;
import com.classassess.classassess.model.User;
import com.classassess.classassess.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        return (User) authentication.getPrincipal();
    }

    // Get all users, with option to include deleted users
    public List<User> getAllUsers(boolean includeDeleted) {
        if (includeDeleted) {
            return userRepository.findAll();
        } else {
            return userRepository.findByIsDeletedFalse();
        }
    }

    // Original getAllUsers now calls the new one with default parameter
    public List<User> getAllUsers() {
        return getAllUsers(false);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRoleAndIsDeletedFalse(role);
    }

    // Updated to exclude deleted users
    public List<User> getUsersByStatus(User.AccountStatus status) {
        return userRepository.findByAccountStatusAndIsDeletedFalse(status);
    }

    // Updated to count only non-deleted users
    public long countUsersByStatus(User.AccountStatus status) {
        return userRepository.countByAccountStatus(status);
    }

    // Updated to count only non-deleted users
    public long countUsers() {
        return userRepository.countByIsDeletedFalse();
    }

    @Transactional
    public User registerNewUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (user.getPasswordHash() == null || user.getPasswordHash().trim().isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }

        // Encode the password if it's not already encoded
        if (!user.getPasswordHash().startsWith("$2a$")) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User updatedUser) {
        User existingUser = getUserById(id);

        // Update fields
        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setDepartment(updatedUser.getDepartment());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setPhoneNumber(updatedUser.getPhoneNumber());

        // Only update password if provided
        if (updatedUser.getPasswordHash() != null && !updatedUser.getPasswordHash().isEmpty()) {
            // Encode the password if it's not already encoded
            if (!updatedUser.getPasswordHash().startsWith("$2a$")) {
                existingUser.setPasswordHash(passwordEncoder.encode(updatedUser.getPasswordHash()));
            } else {
                existingUser.setPasswordHash(updatedUser.getPasswordHash());
            }
        }

        // Update account status if provided
        if (updatedUser.getAccountStatus() != null) {
            existingUser.setAccountStatus(updatedUser.getAccountStatus());
        }

        // Update enabled status if provided
        if (updatedUser.getIsEnabled() != null) {
            existingUser.setIsEnabled(updatedUser.getIsEnabled());
        }

        // Update status update timestamp if provided
        if (updatedUser.getStatusUpdatedAt() != null) {
            existingUser.setStatusUpdatedAt(updatedUser.getStatusUpdatedAt());
        }

        // Update reviewed by ID if provided
        if (updatedUser.getReviewedById() != null) {
            existingUser.setReviewedById(updatedUser.getReviewedById());
        }

        // Update isDeleted status if provided
        if (updatedUser.getIsDeleted() != null) {
            existingUser.setIsDeleted(updatedUser.getIsDeleted());
        }

        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public void changePassword(Long id, String newPassword) {
        User user = getUserById(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void updateUserStatus(Long userId, boolean isEnabled) {
        User user = getUserById(userId);
        user.setIsEnabled(isEnabled);

        // If enabling the user, also update the account status to APPROVED
        if (isEnabled) {
            user.setAccountStatus(User.AccountStatus.APPROVED);
            user.setStatusUpdatedAt(LocalDateTime.now());

            // Get current admin user if available
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User) {
                User admin = (User) auth.getPrincipal();
                user.setReviewedById(admin.getId());
            }
        }

        userRepository.save(user);
    }

    // New method for soft delete
    @Transactional
    public User softDeleteUser(Long id) {
        User user = getUserById(id);
        user.setIsDeleted(true);
        user.setIsEnabled(false); // Disable the user when deleted
        return userRepository.save(user);
    }

    // New method to restore a soft deleted user
    @Transactional
    public User restoreUser(Long id) {
        User user = getUserById(id);
        user.setIsDeleted(false);
        return userRepository.save(user);
    }
}
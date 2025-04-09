package com.classassess.classassess.controller;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.Resource;
import com.classassess.classassess.model.Role;
import com.classassess.classassess.model.User;
import com.classassess.classassess.repository.ResourceRepository;
import com.classassess.classassess.repository.UserSoftDeleteRepository;
import com.classassess.classassess.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final SessionService sessionService;
    private final UserSoftDeleteRepository userSoftDeleteRepository;
    private final ModuleService moduleService;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        try {
            // Count total users
            long totalUsers = userService.countUsers();

            // Count pending approvals
            long pendingApprovals = userService.countUsersByStatus(User.AccountStatus.PENDING);

            // Get active modules count (use the moduleService to get real data)
            long activeModules = moduleService.getAllModulesWithDetails().stream()
                    .filter(ModuleDTO::getIsActive)
                    .count();

            // Get active sessions
            long activeSessions = sessionService.getActiveSessionCount();

            DashboardStatsDTO stats = DashboardStatsDTO.builder()
                    .totalUsers(totalUsers)
                    .pendingApprovals(pendingApprovals)
                    .activeModules(activeModules)
                    .activeSessions(activeSessions)
                    .build();

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/account-requests")
    public ResponseEntity<List<AccountRequestDTO>> getAccountRequests() {
        try {
            List<User> pendingUsers = userService.getUsersByStatus(User.AccountStatus.PENDING);
            List<AccountRequestDTO> requestDTOs = pendingUsers.stream()
                    .map(user -> AccountRequestDTO.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .fullName(user.getFullName())
                            .phoneNumber(user.getPhoneNumber())
                            .department(user.getDepartment())
                            .role(user.getRole())
                            .requestDate(user.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(requestDTOs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/account-requests/{userId}/approve")
    public ResponseEntity<?> approveAccount(@PathVariable Long userId) {
        try {
            // Change from local method to authService method
            authService.updateAccountStatus(userId, User.AccountStatus.APPROVED);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/account-requests/{userId}/reject")
    public ResponseEntity<?> rejectAccount(@PathVariable Long userId) {
        try {
            // Change from local method to authService method
            authService.updateAccountStatus(userId, User.AccountStatus.REJECTED);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void updateAccountStatus(Long userId, User.AccountStatus status) {
        User user = userService.getUserById(userId);

        // Get current admin user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User admin = (User) auth.getPrincipal();

        user.setAccountStatus(status);
        user.setStatusUpdatedAt(LocalDateTime.now());
        user.setReviewedById(admin.getId());

        userService.updateUser(userId, user);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        try {
            List<User> users = userService.getAllUsers(includeDeleted);
            List<UserDTO> userDTOs = users.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(convertToDTO(user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable Role role) {
        List<User> users = userService.getUsersByRole(role);
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }

    @PostMapping("/users")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        System.out.println(userDTO);
        User user = convertToEntity(userDTO);
        // Set account status to APPROVED for users created by admin
        user.setAccountStatus(User.AccountStatus.APPROVED);
        User createdUser = userService.registerNewUser(user);
        return ResponseEntity.ok(convertToDTO(createdUser));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        User user = convertToEntity(userDTO);
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(convertToDTO(updatedUser));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Void> changeUserPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordMap) {
        userService.changePassword(id, passwordMap.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> statusUpdate) {
        try {
            User user = userService.getUserById(id);

            // Update enabled/disabled status
            if (statusUpdate.containsKey("enabled")) {
                user.setIsEnabled((Boolean) statusUpdate.get("enabled"));
            }

            // Update account status if provided
            if (statusUpdate.containsKey("accountStatus") && statusUpdate.get("accountStatus") != null) {
                try {
                    String statusStr = String.valueOf(statusUpdate.get("accountStatus"));
                    User.AccountStatus newStatus = User.AccountStatus.valueOf(statusStr);
                    user.setAccountStatus(newStatus);
                    user.setStatusUpdatedAt(LocalDateTime.now());

                    // Get current admin user
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getPrincipal() instanceof User) {
                        User admin = (User) auth.getPrincipal();
                        user.setReviewedById(admin.getId());
                    }

                    // Send notification to user about account status change
                    boolean isApproved = newStatus == User.AccountStatus.APPROVED;
                    notificationService.handleAccountApprovalNotification(user, isApproved);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().build();
                }
            }

            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(convertToDTO(updatedUser));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private User convertToEntity(UserDTO userDTO) {
        return User.builder()
                .id(userDTO.getId())
                .email(userDTO.getEmail())
                .fullName(userDTO.getFullName())
                .role(userDTO.getRole())
                .department(userDTO.getDepartment())
                .passwordHash(userDTO.getPassword())
                .isEnabled(userDTO.isEnabled())
                .build();
    }

    @GetMapping("/stats/sessions")
    public ResponseEntity<Map<String, Object>> getActiveSessions() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeSessions", sessionService.getActiveSessionCount());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users-with-deleted")
    public ResponseEntity<List<User>> getAllUsersIncludingDeleted() {
        try {
            List<User> users = userSoftDeleteRepository.findAllIncludingDeleted();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/users/{id}/soft-delete")
    public ResponseEntity<?> softDeleteUser(@PathVariable Long id) {
        try {
            User deletedUser = userService.softDeleteUser(id);
            return ResponseEntity.ok(convertToDTO(deletedUser));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/users/{id}/restore")
    public ResponseEntity<?> restoreUser(@PathVariable Long id) {
        try {
            User restoredUser = userService.restoreUser(id);
            return ResponseEntity.ok(convertToDTO(restoredUser));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // convertToDTO method to include isDeleted
    private UserDTO convertToDTO(User user) {
        // Make sure all fields in UserDTO class are properly defined
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .isEnabled(user.getIsEnabled())
                .isAccountNonLocked(user.isAccountNonLocked())
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .isDeleted(user.getIsDeleted()) // Add this line
                .build();
    }

    // Module management endpoints
    @GetMapping("/modules")
    public ResponseEntity<List<ModuleDTO>> getAllModulesForAdmin() {
        return ResponseEntity.ok(moduleService.getAllModulesWithDetails());
    }

    @PatchMapping("/modules/{id}/status")
    public ResponseEntity<ModuleDTO> toggleModuleStatus(@PathVariable Long id, @RequestBody ModuleStatusRequest request) {
        return ResponseEntity.ok(moduleService.toggleModuleStatus(id, request.isActive()));
    }

    @GetMapping("/modules/stats")
    public ResponseEntity<ModuleStatsDTO> getModuleStats() {
        return ResponseEntity.ok(moduleService.getModuleStats());
    }

    @GetMapping("/admin/modules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ModuleDTO>> getAllModulesWithDetails() {
        return ResponseEntity.ok(moduleService.getAllModulesWithDetails());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<ModuleDTO> toggleModuleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> status) {
        boolean isActive = status.get("active");
        return ResponseEntity.ok(moduleService.toggleModuleStatus(id, isActive));
    }

    @DeleteMapping("/{moduleId}/resources/{resourceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER')")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long moduleId,
            @PathVariable Long resourceId) {

        try {
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

            // Verify the resource belongs to the specified module
            if (!resource.getModule().getId().equals(moduleId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Resource doesn't belong to this module"));
            }

            // Get the file path from the URL
            if (resource.getUrl() != null && !resource.getUrl().isEmpty()) {
                String filePath = resource.getUrl().replace("/uploads", "uploads");
                Path path = Paths.get(filePath);

                // Delete the file if it exists
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    // Log the error but continue to delete the database record
                    System.err.println("Error deleting file: " + e.getMessage());
                }
            }

            // Delete the resource record
            resourceRepository.delete(resource);

            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Resource deleted successfully"));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error deleting resource: " + e.getMessage()));
        }
    }

}
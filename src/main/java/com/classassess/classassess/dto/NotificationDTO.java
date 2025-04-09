package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private Object data;
    private LocalDateTime timestamp;
    private boolean read;

    // Static factory methods for common notification types
    public static NotificationDTO forAnnouncement(String moduleId, String moduleName, String title, String content) {
        return NotificationDTO.builder()
                .type("ANNOUNCEMENT")
                .title("New Announcement for " + moduleName)
                .message(title)
                .actionUrl("/module/" + moduleId)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forResource(String moduleId, String moduleName, String resourceName) {
        return NotificationDTO.builder()
                .type("RESOURCE")
                .title("New Learning Resource for " + moduleName)
                .message(resourceName + " has been added")
                .actionUrl("/module/" + moduleId + "/resources")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forModuleDeactivation(String moduleName) {
        return NotificationDTO.builder()
                .type("MODULE")
                .title("Module Deactivation: " + moduleName)
                .message("The module " + moduleName + " has been deactivated")
                .actionUrl("/student/dashboard")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forModuleActivation(String moduleTitle) {
        return NotificationDTO.builder()
                .type("MODULE")
                .title("Module Activation: " + moduleTitle)
                .message("The module '" + moduleTitle + "' has been activated")
                .actionUrl("/student/dashboard")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forTestCreation(String moduleId, String moduleName, String testTitle) {
        return NotificationDTO.builder()
                .type("TEST")
                .title("New Test Created: " + testTitle)
                .message("A new test for " + moduleName + " has been created")
                .actionUrl("/module/" + moduleId + "/tests")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forTestCancellation(String moduleName, String testTitle) {
        return NotificationDTO.builder()
                .type("TEST")
                .title("Test Cancelled: " + testTitle)
                .message("The test for " + moduleName + " has been cancelled")
                .actionUrl("/student/dashboard")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forAppealSubmission(String appealId, String testTitle) {
        return NotificationDTO.builder()
                .type("APPEAL")
                .title("New Appeal Submission: " + testTitle)
                .message("A student has submitted an appeal")
                .actionUrl("/lecturer/appeals/" + appealId)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forAppealUpdate(String appealId, String testTitle, String status) {
        String statusMsg = "APPROVED".equals(status) ? "approved" :
                "REJECTED".equals(status) ? "rejected" : "updated";

        return NotificationDTO.builder()
                .type("APPEAL")
                .title("Appeal Status Update: " + testTitle)
                .message("Your appeal has been " + statusMsg)
                .actionUrl("/student/appeal/" + appealId)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forAccountApproval(boolean isApproved) {
        return NotificationDTO.builder()
                .type("ACCOUNT")
                .title(isApproved ? "Account Approved" : "Account Registration Status")
                .message(isApproved ? "Your account has been approved!" : "Your account registration status has been updated")
                .actionUrl("/login")
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();
    }

    public static NotificationDTO forNewRegistration(String userName, String userEmail, String role) {
        return NotificationDTO.builder()
                .type("REGISTRATION")
                .title("New User Registration")
                .message("New " + role.toLowerCase() + " registered: " + userName + " (" + userEmail + ")")
                .actionUrl("/admin/user-management")
                .read(false)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
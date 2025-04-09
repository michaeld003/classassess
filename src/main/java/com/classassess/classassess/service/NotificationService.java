package com.classassess.classassess.service;

import com.classassess.classassess.dto.ModuleDTO;
import com.classassess.classassess.dto.NotificationDTO;
import com.classassess.classassess.dto.TestDTO;
import com.classassess.classassess.dto.UserDTO;
import com.classassess.classassess.model.*;
import com.classassess.classassess.repository.ModuleStudentRepository;
import com.classassess.classassess.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ModuleStudentRepository moduleStudentRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * Send a notification to a specific user via WebSocket
     */
    public void sendUserNotification(Long userId, NotificationDTO notification) {
        // Add unique ID to notification
        notification.setId(UUID.randomUUID().toString());

        log.info("Sending notification to user {}: {}", userId, notification.getTitle());
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                notification
        );
    }

    /**
     * Send a notification to all users enrolled in a module
     */
    public void sendModuleNotification(Long moduleId, NotificationDTO notification) {
        // Add unique ID to notification
        notification.setId(UUID.randomUUID().toString());

        log.info("Sending notification to module {}: {}", moduleId, notification.getTitle());
        messagingTemplate.convertAndSend(
                "/topic/module/" + moduleId,
                notification
        );
    }

    /**
     * Handle announcement notifications (WebSocket and email)
     */
    public void handleAnnouncementNotification(Announcement announcement, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling announcement notification for module: {}", module.getTitle());

            // Create WebSocket notification
            NotificationDTO notification = NotificationDTO.forAnnouncement(
                    module.getId().toString(),
                    module.getTitle(),
                    announcement.getTitle(),
                    announcement.getContent()
            );

            // Send via WebSocket to all module students
            sendModuleNotification(module.getId(), notification);

            // Send emails to all students enrolled in the module
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);
            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    emailService.sendAnnouncementNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle(),
                            announcement.getTitle(),
                            announcement.getContent()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error sending announcement notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle resource upload notifications (WebSocket and email)
     */
    public void handleResourceNotification(Resource resource, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling resource notification for module: {}", module.getTitle());

            // Create WebSocket notification
            NotificationDTO notification = NotificationDTO.forResource(
                    module.getId().toString(),
                    module.getTitle(),
                    resource.getTitle()
            );

            // Send via WebSocket to all module students
            sendModuleNotification(module.getId(), notification);

            // Send emails to all students enrolled in the module
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);
            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    emailService.sendResourceUploadNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle(),
                            resource.getTitle(),
                            resource.getType()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error sending resource notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle module activation notifications (WebSocket and email)
     */
    public void handleModuleActivationNotification(com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling module activation notification for module: {}", module.getTitle());

            // Get all enrolled students
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);

            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    // Create WebSocket notification for this student
                    NotificationDTO notification = NotificationDTO.forModuleActivation(module.getTitle());

                    // Send via WebSocket
                    sendUserNotification(student.getId(), notification);

                    // Send email
                    emailService.sendModuleActivationNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle()
                    );
                }
            }

            // Also notify the module lecturer
            User lecturer = module.getLecturer();
            if (lecturer != null) {
                // Create WebSocket notification for the lecturer
                NotificationDTO notification = NotificationDTO.forModuleActivation(module.getTitle());

                // Send via WebSocket
                sendUserNotification(lecturer.getId(), notification);

                // Send email
                emailService.sendModuleActivationNotification(
                        lecturer.getEmail(),
                        lecturer.getFullName(),
                        module.getTitle()
                );
            }
        } catch (Exception e) {
            log.error("Error sending module activation notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle module deactivation notifications (WebSocket and email)
     */
    public void handleModuleDeactivationNotification(com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling module deactivation notification for module: {}", module.getTitle());

            // Get all enrolled students
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);

            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    // Create WebSocket notification for this student
                    NotificationDTO notification = NotificationDTO.forModuleDeactivation(module.getTitle());

                    // Send via WebSocket
                    sendUserNotification(student.getId(), notification);

                    // Send email
                    emailService.sendModuleDeactivationNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle()
                    );
                }
            }
            // Also notify the lecturer
            User lecturer = module.getLecturer();
            if (lecturer != null) {
                // Create WebSocket notification for lecturer
                NotificationDTO notification = NotificationDTO.forModuleDeactivation(module.getTitle());

                // Send via WebSocket
                sendUserNotification(lecturer.getId(), notification);

                // Send email
                emailService.sendModuleDeactivationNotification(
                        lecturer.getEmail(),
                        lecturer.getFullName(),
                        module.getTitle()
                );
            }
        } catch (Exception e) {
            log.error("Error sending module deactivation notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle test creation notifications (WebSocket and email)
     */
    public void handleTestCreationNotification(Test test, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling test creation notification for module: {}", module.getTitle());

            // Create WebSocket notification
            NotificationDTO notification = NotificationDTO.forTestCreation(
                    module.getId().toString(),
                    module.getTitle(),
                    test.getTitle()
            );

            // Send via WebSocket to all module students
            sendModuleNotification(module.getId(), notification);

            // Format deadline for email
            String deadlineStr = test.getEndTime().format(DATE_FORMATTER);

            // Send emails to all students enrolled in the module
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);
            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    emailService.sendTestCreationNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle(),
                            test.getTitle(),
                            deadlineStr
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error sending test creation notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle test cancellation notifications (WebSocket and email)
     */
    public void handleTestCancellationNotification(Test test, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling test cancellation notification for module: {}", module.getTitle());

            // Create WebSocket notification
            NotificationDTO notification = NotificationDTO.forTestCancellation(
                    module.getTitle(),
                    test.getTitle()
            );

            // Send via WebSocket to all module students
            sendModuleNotification(module.getId(), notification);

            // Send emails to all students enrolled in the module
            List<ModuleStudent> enrolledStudents = moduleStudentRepository.findByModule(module);
            for (ModuleStudent ms : enrolledStudents) {
                User student = ms.getStudent();
                if (student != null) {
                    emailService.sendTestCancellationNotification(
                            student.getEmail(),
                            student.getFullName(),
                            module.getTitle(),
                            test.getTitle()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error sending test cancellation notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle appeal submission notifications (WebSocket and email)
     */
    public void handleAppealSubmissionNotification(Appeal appeal, Test test, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling appeal submission notification for test: {}", test.getTitle());

            // Get the lecturer and student
            User lecturer = module.getLecturer();

            // Get the student from the submission which is linked to the appeal
            User student = appeal.getSubmission().getStudent();

            if (lecturer != null && student != null) {
                // Create WebSocket notification
                NotificationDTO notification = NotificationDTO.forAppealSubmission(
                        appeal.getId().toString(),
                        test.getTitle()
                );

                // Send via WebSocket
                sendUserNotification(lecturer.getId(), notification);

                // Send email
                emailService.sendAppealSubmissionNotification(
                        lecturer.getEmail(),
                        lecturer.getFullName(),
                        module.getTitle(),
                        test.getTitle(),
                        student.getFullName(),
                        appeal.getReason()
                );
            }
        } catch (Exception e) {
            log.error("Error sending appeal submission notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle appeal status update notifications (WebSocket and email)
     */
    public void handleAppealStatusUpdateNotification(Appeal appeal, Test test, com.classassess.classassess.model.Module module) {
        try {
            log.info("Handling appeal status update notification for test: {}", test.getTitle());

            // Get the student from the submission which is linked to the appeal
            User student = appeal.getSubmission().getStudent();

            if (student != null) {
                // Create WebSocket notification
                NotificationDTO notification = NotificationDTO.forAppealUpdate(
                        appeal.getId().toString(),
                        test.getTitle(),
                        appeal.getStatus().name()
                );

                // Send via WebSocket
                sendUserNotification(student.getId(), notification);

                // Send email - using the appropriate fields from the Appeal class
                emailService.sendAppealStatusUpdateNotification(
                        student.getEmail(),
                        student.getFullName(),
                        module.getTitle(),
                        test.getTitle(),
                        appeal.getStatus().name(),
                        appeal.getFeedback(),  // Using feedback field instead of lecturerResponse
                        appeal.getUpdatedScore() // Using updatedScore field instead of newGrade
                );
            }
        } catch (Exception e) {
            log.error("Error sending appeal status update notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle account approval notifications (WebSocket and email)
     */
    public void handleAccountApprovalNotification(User user, boolean isApproved) {
        try {
            log.info("Handling account approval notification for user: {}", user.getFullName());

            // Create WebSocket notification
            NotificationDTO notification = NotificationDTO.forAccountApproval(isApproved);

            // Send via WebSocket
            sendUserNotification(user.getId(), notification);

            // Send email
            emailService.sendAccountApprovalNotification(
                    user.getEmail(),
                    user.getFullName(),
                    isApproved
            );
        } catch (Exception e) {
            log.error("Error sending account approval notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle new user registration notification to admin
     */
    public void handleNewRegistrationNotification(User newUser) {
        try {
            log.info("Handling new registration notification for: {}", newUser.getFullName());

            // Find all admin users
            List<User> adminUsers = userRepository.findByRole(Role.ADMIN);

            for (User admin : adminUsers) {
                // Create WebSocket notification
                NotificationDTO notification = NotificationDTO.forNewRegistration(
                        newUser.getFullName(),
                        newUser.getEmail(),
                        newUser.getRole().name()
                );

                // Send via WebSocket
                sendUserNotification(admin.getId(), notification);

                // Send email
                emailService.sendNewRegistrationNotification(
                        admin.getEmail(),
                        admin.getFullName(),
                        newUser.getFullName(),
                        newUser.getEmail(),
                        newUser.getRole().name()
                );
            }
        } catch (Exception e) {
            log.error("Error sending new registration notification: {}", e.getMessage(), e);
        }
    }
}
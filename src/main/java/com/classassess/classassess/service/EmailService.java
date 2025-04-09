package com.classassess.classassess.service;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Password Reset");

            String resetUrl = frontendUrl + "/reset-password/" + token;

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>ClassAssess Password Reset</h2>" +
                    "<p>Hello,</p>" +
                    "<p>You have requested to reset your password. Please click the link below to reset it:</p>" +
                    "<p><a href='" + resetUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Reset Password</a></p>" +
                    "<p>Or copy and paste this URL into your browser:</p>" +
                    "<p><a href='" + resetUrl + "'>" + resetUrl + "</a></p>" +
                    "<p>This link will expire in 1 hour.</p>" +
                    "<p>If you did not request a password reset, please ignore this email.</p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", to, e);
        }
    }

    @Async
    public void sendAnnouncementNotification(String to, String studentName, String moduleName, String announcementTitle, String announcementContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - New Announcement for " + moduleName);

            String moduleUrl = frontendUrl + "/module/" + moduleName.replaceAll("\\s+", "-").toLowerCase();

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>New Announcement</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<p>Your lecturer has posted a new announcement for <strong>" + moduleName + "</strong>:</p>" +
                    "<div style='background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3f51b5; margin: 20px 0;'>" +
                    "<h3 style='margin-top: 0;'>" + announcementTitle + "</h3>" +
                    "<p>" + announcementContent + "</p>" +
                    "</div>" +
                    "<p>Please log in to your ClassAssess account to view the full announcement.</p>" +
                    "<p><a href='" + moduleUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Module</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Announcement notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send announcement notification to: {}", to, e);
        }
    }

    @Async
    public void sendResourceUploadNotification(String to, String studentName, String moduleName, String resourceName, String resourceType) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - New Learning Resource for " + moduleName);

            String resourcesUrl = frontendUrl + "/module/" + moduleName.replaceAll("\\s+", "-").toLowerCase() + "/resources";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>New Learning Resource</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<p>Your lecturer has uploaded a new learning resource for <strong>" + moduleName + "</strong>:</p>" +
                    "<div style='background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 20px 0; border-radius: 5px;'>" +
                    "<h3 style='margin-top: 0;'>" + resourceName + "</h3>" +
                    "<p>File type: " + resourceType + "</p>" +
                    "</div>" +
                    "<p>Please log in to your ClassAssess account to access this resource.</p>" +
                    "<p><a href='" + resourcesUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Resources</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Resource upload notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send resource upload notification to: {}", to, e);
        }
    }



    @Async
    public void sendModuleDeactivationNotification(String to, String studentName, String moduleName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Module Deactivation Notice: " + moduleName);

            String dashboardUrl = frontendUrl + "/student/dashboard";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Module Deactivation Notice</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<div style='background-color: #ffeeee; border-left: 4px solid #ff5252; padding: 15px; margin: 20px 0;'>" +
                    "<p>We're writing to inform you that the module <strong>" + moduleName + "</strong> has been deactivated.</p>" +
                    "</div>" +
                    "<p>This means that:</p>" +
                    "<ul>" +
                    "<li>You will no longer be able to access this module or its content</li>" +
                    "<li>Any pending tests for this module are no longer available</li>" +
                    "<li>Your existing submissions and grades for this module are preserved in your records</li>" +
                    "</ul>" +
                    "<p>For any questions regarding this deactivation, please contact your module lecturer or academic advisor.</p>" +
                    "<p><a href='" + dashboardUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Dashboard</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Module deactivation notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send module deactivation notification to: {}", to, e);
        }
    }

    @Async
    public void sendModuleActivationNotification(String to, String recipientName, String moduleName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Module Activation Notice: " + moduleName);

            String dashboardUrl = frontendUrl + "/dashboard";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Module Activation Notice</h2>" +
                    "<p>Hello " + recipientName + ",</p>" +
                    "<div style='background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;'>" +
                    "<p>We're pleased to inform you that the module <strong>" + moduleName + "</strong> has been activated.</p>" +
                    "</div>" +
                    "<p>This means that:</p>" +
                    "<ul>" +
                    "<li>You now have full access to this module and its content</li>" +
                    "<li>You can participate in tests and assessments for this module</li>" +
                    "<li>You can access learning resources for this module</li>" +
                    "</ul>" +
                    "<p><a href='" + dashboardUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Dashboard</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Module activation notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send module activation notification to: {}", to, e);
        }
    }

    @Async
    public void sendNewRegistrationNotification(String to, String adminName, String newUserName, String newUserEmail, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - New User Registration Requires Approval");

            String adminUrl = frontendUrl + "/admin/user-management";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>New User Registration</h2>" +
                    "<p>Hello " + adminName + ",</p>" +
                    "<p>A new user has registered on the ClassAssess platform and requires your approval:</p>" +
                    "<div style='background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 20px 0; border-radius: 5px;'>" +
                    "<p><strong>Name:</strong> " + newUserName + "</p>" +
                    "<p><strong>Email:</strong> " + newUserEmail + "</p>" +
                    "<p><strong>Role:</strong> " + role + "</p>" +
                    "</div>" +
                    "<p>Please log in to your admin dashboard to review and approve/reject this registration.</p>" +
                    "<p><a href='" + adminUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to User Management</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("New registration notification email sent successfully to admin: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send new registration notification to admin: {}", to, e);
        }
    }

    @Async
    public void sendTestCreationNotification(String to, String studentName, String moduleName, String testTitle, String testDeadline) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - New Test Created: " + testTitle);

            String moduleUrl = frontendUrl + "/module/" + moduleName.replaceAll("\\s+", "-").toLowerCase();

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>New Test Created</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<p>A new test has been created for your module <strong>" + moduleName + "</strong>:</p>" +
                    "<div style='background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 20px 0; border-radius: 5px;'>" +
                    "<h3 style='margin-top: 0;'>" + testTitle + "</h3>" +
                    "<p>Deadline: <span style='color: #d32f2f; font-weight: bold;'>" + testDeadline + "</span></p>" +
                    "</div>" +
                    "<p>Please log in to your ClassAssess account to view the test details and prepare for your assessment.</p>" +
                    "<p><a href='" + moduleUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Module</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Test creation notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send test creation notification to: {}", to, e);
        }
    }

    @Async
    public void sendTestCancellationNotification(String to, String studentName, String moduleName, String testTitle) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Test Cancelled: " + testTitle);

            String dashboardUrl = frontendUrl + "/student/dashboard";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Test Cancellation Notice</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<div style='background-color: #ffeeee; border-left: 4px solid #ff5252; padding: 15px; margin: 20px 0;'>" +
                    "<p>We're writing to inform you that the test <strong>" + testTitle + "</strong> for the module <strong>" + moduleName + "</strong> has been cancelled.</p>" +
                    "</div>" +
                    "<p>Please log in to your ClassAssess account for more information or contact your module lecturer if you have any questions.</p>" +
                    "<p><a href='" + dashboardUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Dashboard</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Test cancellation notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send test cancellation notification to: {}", to, e);
        }
    }

    @Async
    public void sendAppealSubmissionNotification(String to, String lecturerName, String moduleName, String testTitle, String studentName, String appealReason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - New Appeal Submission for " + testTitle);

            String appealsUrl = frontendUrl + "/lecturer/appeals";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>New Appeal Submission</h2>" +
                    "<p>Hello " + lecturerName + ",</p>" +
                    "<p>A student has submitted an appeal for the test <strong>" + testTitle + "</strong> in <strong>" + moduleName + "</strong>:</p>" +
                    "<div style='background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3f51b5; margin: 20px 0;'>" +
                    "<p><strong>Student:</strong> " + studentName + "</p>" +
                    "<p><strong>Appeal Reason:</strong></p>" +
                    "<p>" + appealReason + "</p>" +
                    "</div>" +
                    "<p>Please log in to your ClassAssess account to review and respond to this appeal.</p>" +
                    "<p><a href='" + appealsUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Appeals</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Appeal submission notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send appeal submission notification to: {}", to, e);
        }
    }

    @Async
    public void sendAppealStatusUpdateNotification(String to, String studentName, String moduleName, String testTitle, String status, String lecturerResponse, Double newGrade) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Appeal Status Update for " + testTitle);

            String appealsUrl = frontendUrl + "/student/appeals";

            // Determine box style based on status
            String boxStyle = "background-color: #f5f5f5; padding: 15px; margin: 20px 0; ";
            if ("APPROVED".equals(status)) {
                boxStyle += "border-left: 4px solid #4caf50;";
            } else if ("REJECTED".equals(status)) {
                boxStyle += "border-left: 4px solid #f44336;";
            } else {
                boxStyle += "border-left: 4px solid #ff9800;";
            }

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Appeal Status Update</h2>" +
                    "<p>Hello " + studentName + ",</p>" +
                    "<p>There has been an update to your appeal for the test <strong>" + testTitle + "</strong> in <strong>" + moduleName + "</strong>:</p>" +
                    "<div style='" + boxStyle + "'>" +
                    "<h3 style='margin-top: 0;'>Appeal Status: " + status + "</h3>";

            if (lecturerResponse != null && !lecturerResponse.isEmpty()) {
                htmlContent += "<p><strong>Lecturer Response:</strong></p>" +
                        "<p>" + lecturerResponse + "</p>";
            }

            if ("APPROVED".equals(status) && newGrade != null) {
                htmlContent += "<p><strong>Updated Grade:</strong> <span style='font-size: 18px; font-weight: bold;'>" + newGrade + "%</span></p>";
            }

            htmlContent += "</div>" +
                    "<p>Please log in to your ClassAssess account to view the complete details of your appeal status.</p>" +
                    "<p><a href='" + appealsUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Appeal Details</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Appeal status update notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send appeal status update notification to: {}", to, e);
        }
    }

    @Async
    public void sendAccountApprovalNotification(String to, String userName, boolean isApproved) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(isApproved ? "ClassAssess - Your Account Has Been Approved" : "ClassAssess - Your Account Registration Status");

            String loginUrl = frontendUrl + "/login";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>";

            if (isApproved) {
                htmlContent += "<h2 style='color: #3f51b5;'>Account Approved</h2>" +
                        "<p>Hello " + userName + ",</p>" +
                        "<div style='background-color: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 5px; margin: 20px 0;'>" +
                        "<p><strong>Good news!</strong> Your ClassAssess account has been approved.</p>" +
                        "</div>" +
                        "<p>You can now log in to your account and access all features of the ClassAssess platform, including:</p>" +
                        "<ul>" +
                        "<li>Access to your enrolled modules</li>" +
                        "<li>Taking tests and assessments</li>" +
                        "<li>Viewing grades and feedback</li>" +
                        "<li>Accessing learning resources</li>" +
                        "</ul>" +
                        "<p>We're excited to have you join our learning community!</p>";
            } else {
                htmlContent += "<h2 style='color: #3f51b5;'>Account Registration Update</h2>" +
                        "<p>Hello " + userName + ",</p>" +
                        "<p>We're writing to inform you that your ClassAssess account registration has been reviewed. Unfortunately, your account has not been approved at this time.</p>" +
                        "<p>This may be due to one of the following reasons:</p>" +
                        "<ul>" +
                        "<li>Incomplete registration information</li>" +
                        "<li>Verification of student/lecturer status required</li>" +
                        "<li>An administrative error</li>" +
                        "</ul>" +
                        "<p>Please contact your institution's administrator for more information.</p>";
            }

            htmlContent += "<p><a href='" + loginUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Login</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Account approval notification email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send account approval notification to: {}", to, e);
        }
    }
    @Async
    public void sendModuleStatusChangeNotification(String to, String adminName, String moduleName, boolean isActive) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Module " + (isActive ? "Activation" : "Deactivation") + " Notice: " + moduleName);

            String adminUrl = frontendUrl + "/admin/modules";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Module " + (isActive ? "Activation" : "Deactivation") + " Notice</h2>" +
                    "<p>Hello " + adminName + ",</p>" +
                    "<div style='background-color: " + (isActive ? "#e8f5e9" : "#ffeeee") + "; border-left: 4px solid " +
                    (isActive ? "#4caf50" : "#ff5252") + "; padding: 15px; margin: 20px 0;'>" +
                    "<p>This is to inform you that the module <strong>" + moduleName + "</strong> has been " +
                    (isActive ? "activated" : "deactivated") + ".</p>" +
                    "</div>" +
                    "<p><a href='" + adminUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>View Modules</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Module status change notification email sent successfully to admin: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send module status change notification to admin: {}", to, e);
        }
    }
    @Async
    public void sendRegistrationAcknowledgmentEmail(String to, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("ClassAssess - Thank You for Registering");

            String loginUrl = frontendUrl + "/login";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                    "<h2 style='color: #3f51b5;'>Thank You for Registering</h2>" +
                    "<p>Hello " + userName + ",</p>" +
                    "<p>Thank you for registering with ClassAssess. Your account has been created and is pending approval.</p>" +
                    "<p>Once an administrator approves your account, you will receive another email notification and can begin using the system.</p>" +
                    "<p><a href='" + loginUrl + "' style='background-color: #3f51b5; color: white; padding: 10px 20px; " +
                    "text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Login</a></p>" +
                    "<p>Regards,<br>ClassAssess Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Registration acknowledgment email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send registration acknowledgment email to: {}", to, e);
        }
    }
}
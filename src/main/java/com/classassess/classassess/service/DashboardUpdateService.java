package com.classassess.classassess.service;

import com.classassess.classassess.dto.DashboardUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending real-time updates to the dashboard via WebSocket
 */
@Service
@RequiredArgsConstructor
public class DashboardUpdateService {
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send dashboard update to a specific lecturer
     */
    public void sendDashboardUpdate(Long lecturerId, DashboardUpdateDTO update) {
        messagingTemplate.convertAndSend("/topic/dashboard/" + lecturerId, update);
    }

    /**
     * Send test submission update
     */
    public void sendTestSubmissionUpdate(Long testId, Long lecturerId) {
        DashboardUpdateDTO update = new DashboardUpdateDTO();
        update.setType("TEST_SUBMISSION");
        update.setEntityId(testId);
        update.setMessage("New test submission received");

        sendDashboardUpdate(lecturerId, update);
    }

    /**
     * Send appeal submission update
     */
    public void sendAppealUpdate(Long appealId, Long lecturerId) {
        DashboardUpdateDTO update = new DashboardUpdateDTO();
        update.setType("APPEAL_SUBMISSION");
        update.setEntityId(appealId);
        update.setMessage("New appeal received");

        sendDashboardUpdate(lecturerId, update);
    }

    /**
     * Send student enrollment update
     */
    public void sendStudentEnrollmentUpdate(Long moduleId, Long lecturerId) {
        DashboardUpdateDTO update = new DashboardUpdateDTO();
        update.setType("STUDENT_ENROLLMENT");
        update.setEntityId(moduleId);
        update.setMessage("New student enrolled in module");

        sendDashboardUpdate(lecturerId, update);
    }
}
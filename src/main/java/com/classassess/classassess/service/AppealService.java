package com.classassess.classassess.service;

import com.classassess.classassess.dto.AppealDTO;
import com.classassess.classassess.dto.AppealQuestionDTO;
import com.classassess.classassess.dto.AppealResolutionDTO;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.*;
import com.classassess.classassess.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppealService {
    private final AppealRepository appealRepository;
    private final AppealQuestionRepository appealQuestionRepository;
    private final SubmissionRepository submissionRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final AnswerRepository answerRepository;

    /**
     * Submit a new appeal for a test submission
     */
    @Transactional
    public AppealDTO submitAppeal(Long submissionId, AppealDTO appealDTO) {
        User currentUser = userService.getCurrentUser();

        // Find the submission
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        // Check if user owns the submission
        if (!submission.getStudent().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only appeal your own submissions");
        }

        // Check if submission already has a pending appeal
        if (appealRepository.findBySubmission_Student_Id(currentUser.getId()).stream()
                .anyMatch(a -> a.getStatus() == AppealStatus.PENDING && a.getSubmission().getId().equals(submissionId))) {
            throw new IllegalStateException("This submission already has a pending appeal");
        }

        // Create and save the appeal
        Appeal appeal = new Appeal();
        appeal.setSubmission(submission);
        appeal.setTest(submission.getTest());
        appeal.setOriginalScore(submission.getTotalScore());
        appeal.setRequestedScore(appealDTO.getRequestedScore());
        appeal.setReason(appealDTO.getReason());
        appeal.setStatus(AppealStatus.PENDING);
        appeal.setCreatedAt(LocalDateTime.now());

        Appeal savedAppeal = appealRepository.save(appeal);
        notificationService.handleAppealSubmissionNotification(savedAppeal, savedAppeal.getTest(), savedAppeal.getTest().getModule());

        // Save the associated questions
        if (appealDTO.getQuestions() != null && !appealDTO.getQuestions().isEmpty()) {
            for (AppealQuestionDTO questionDTO : appealDTO.getQuestions()) {
                Question question = questionRepository.findById(Long.parseLong(questionDTO.getQuestionId()))
                        .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

                AppealQuestion appealQuestion = new AppealQuestion();
                appealQuestion.setAppeal(savedAppeal);
                appealQuestion.setQuestion(question);
                appealQuestion.setStudentAnswer(questionDTO.getQuestionAnswer());
                appealQuestion.setReason(questionDTO.getReason());

                appealQuestionRepository.save(appealQuestion);
            }
        }

        return convertToDTO(savedAppeal);
    }

    /**
     * Get all appeals for a lecturer's tests
     */
    public List<AppealDTO> getAppealsForLecturer() {
        User lecturer = userService.getCurrentUser();

        if (lecturer.getRole() != Role.LECTURER) {
            throw new AccessDeniedException("Only lecturers can access appeals");
        }

        return appealRepository.findByLecturerIdAndStatus(lecturer.getId(), AppealStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get appeals count for a lecturer's dashboard
     */
    public Long getAppealCountForLecturer() {
        User lecturer = userService.getCurrentUser();

        if (lecturer.getRole() != Role.LECTURER) {
            return 0L;
        }

        return appealRepository.countByLecturerIdAndStatus(lecturer.getId(), AppealStatus.PENDING);
    }

    /**
     * Resolve an appeal (approve or reject)
     */
    @Transactional
    public AppealDTO resolveAppeal(Long appealId, AppealResolutionDTO resolutionDTO) {
        User lecturer = userService.getCurrentUser();

        if (lecturer.getRole() != Role.LECTURER) {
            throw new AccessDeniedException("Only lecturers can resolve appeals");
        }

        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found"));

        // Check if the lecturer owns this test
        if (!appeal.getTest().getLecturer().getId().equals(lecturer.getId())) {
            throw new AccessDeniedException("You can only resolve appeals for your own tests");
        }

        // Check if appeal is still pending
        if (appeal.getStatus() != AppealStatus.PENDING) {
            throw new IllegalStateException("This appeal has already been resolved");
        }

        // Check if resolving a specific question or the entire appeal
        if (resolutionDTO.getQuestionId() != null) {
            // Resolve a specific question within the appeal
            Question question = questionRepository.findById(resolutionDTO.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

            Submission submission = appeal.getSubmission();

            // Find the answer for this question in the submission
            Answer answer = submission.getAnswers().stream()
                    .filter(a -> a.getQuestion().getId().equals(question.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Answer not found for this question"));

            // Update individual answer if approved
            if (resolutionDTO.isApproved() && resolutionDTO.getQuestionScore() != null) {
                // Store old score for reference
                double oldScore = answer.getScore();

                // Update answer with new score
                answer.setScore(resolutionDTO.getQuestionScore());
                answer.setAppealStatus(AppealStatus.APPROVED);
                answer.setAppealResponse(resolutionDTO.getFeedback());
                answer.setAppealResolvedDate(LocalDateTime.now());

                // Recalculate the total submission score
                recalculateSubmissionScore(submission);
                appeal.setUpdatedScore(submission.getTotalScore());
            } else {
                // Mark as rejected if not approved
                answer.setAppealStatus(AppealStatus.REJECTED);
                answer.setAppealResponse(resolutionDTO.getFeedback());
                answer.setAppealResolvedDate(LocalDateTime.now());
                appeal.setUpdatedScore(appeal.getOriginalScore()); // Keep original score if rejected
            }

            submissionRepository.save(submission);

            // Update the appeal question status
            AppealQuestion appealQuestion = appealQuestionRepository.findByAppealIdAndQuestionId(appealId, question.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appealed question not found"));

            appealQuestion.setStatus(resolutionDTO.isApproved() ? AppealStatus.APPROVED : AppealStatus.REJECTED);
            appealQuestion.setFeedback(resolutionDTO.getFeedback());
            appealQuestionRepository.save(appealQuestion);

            // Check if all questions in the appeal have been resolved
            boolean allQuestionsResolved = true;
            for (AppealQuestion aq : appeal.getAppealQuestions()) {
                if (aq.getStatus() == null || aq.getStatus() == AppealStatus.PENDING) {
                    allQuestionsResolved = false;
                    break;
                }
            }

            // If all questions resolved, update appeal status based on majority
            if (allQuestionsResolved) {
                long approvedCount = appeal.getAppealQuestions().stream()
                        .filter(aq -> aq.getStatus() == AppealStatus.APPROVED)
                        .count();

                AppealStatus finalStatus = (approvedCount > appeal.getAppealQuestions().size() / 2)
                        ? AppealStatus.APPROVED
                        : AppealStatus.REJECTED;

                appeal.setStatus(finalStatus);
                appeal.setFeedback("Multiple questions in this appeal were reviewed. See individual feedback for details.");
                appeal.setResolvedBy(lecturer);
                appeal.setResolvedAt(LocalDateTime.now());
            }
        } else if (resolutionDTO.getQuestionScores() != null && !resolutionDTO.getQuestionScores().isEmpty()) {
            // Handle multiple question updates at once
            Submission submission = appeal.getSubmission();
            AppealStatus newStatus = resolutionDTO.isApproved() ? AppealStatus.APPROVED : AppealStatus.REJECTED;

            // Update each question score
            for (Map.Entry<Long, Double> entry : resolutionDTO.getQuestionScores().entrySet()) {
                Long questionId = entry.getKey();
                Double newScore = entry.getValue();

                // Find the answer for this question in the submission
                submission.getAnswers().stream()
                        .filter(a -> a.getQuestion().getId().equals(questionId))
                        .findFirst()
                        .ifPresent(answer -> {
                            answer.setScore(newScore);
                            answer.setAppealStatus(newStatus);
                            answer.setAppealResponse(resolutionDTO.getFeedback());
                            answer.setAppealResolvedDate(LocalDateTime.now());
                        });

                // Update the appeal question status
                appealQuestionRepository.findByAppealIdAndQuestionId(appealId, questionId)
                        .ifPresent(aq -> {
                            aq.setStatus(newStatus);
                            aq.setFeedback(resolutionDTO.getFeedback());
                            appealQuestionRepository.save(aq);
                        });
            }

            // Recalculate total score
            recalculateSubmissionScore(submission);

            // Set the updated score
            if (resolutionDTO.isApproved()) {
                appeal.setUpdatedScore(submission.getTotalScore());
            } else {
                appeal.setUpdatedScore(appeal.getOriginalScore());
            }

            submissionRepository.save(submission);

            // Update overall appeal status
            appeal.setStatus(newStatus);
            appeal.setFeedback(resolutionDTO.getFeedback());
            appeal.setResolvedBy(lecturer);
            appeal.setResolvedAt(LocalDateTime.now());
        } else {
            // Resolve the entire appeal at once
            AppealStatus newStatus = resolutionDTO.isApproved() ? AppealStatus.APPROVED : AppealStatus.REJECTED;
            appeal.setStatus(newStatus);
            appeal.setFeedback(resolutionDTO.getFeedback());
            appeal.setResolvedBy(lecturer);
            appeal.setResolvedAt(LocalDateTime.now());

            // Update all associated questions
            for (AppealQuestion aq : appeal.getAppealQuestions()) {
                aq.setStatus(newStatus);
                aq.setFeedback(resolutionDTO.getFeedback());
                appealQuestionRepository.save(aq);
            }

            // If approved, update submission score
            if (resolutionDTO.isApproved()) {
                Submission submission = appeal.getSubmission();

                if (resolutionDTO.getNewScore() != null) {
                    // If directly setting a new overall score
                    submission.setTotalScore(resolutionDTO.getNewScore());
                    appeal.setUpdatedScore(resolutionDTO.getNewScore());
                } else {
                    // Update all answers in the submission to match the appeal status
                    for (Answer answer : submission.getAnswers()) {
                        for (AppealQuestion aq : appeal.getAppealQuestions()) {
                            if (answer.getQuestion().getId().equals(aq.getQuestion().getId())) {
                                answer.setAppealStatus(newStatus);
                                answer.setAppealResponse(resolutionDTO.getFeedback());
                                answer.setAppealResolvedDate(LocalDateTime.now());
                            }
                        }
                    }
                    // Recalculate the score and set the updated score
                    recalculateSubmissionScore(submission);
                    appeal.setUpdatedScore(submission.getTotalScore());
                }

                submissionRepository.save(submission);
            } else {
                // If rejected, keep the original score
                appeal.setUpdatedScore(appeal.getOriginalScore());
            }
        }

        Appeal savedAppeal = appealRepository.save(appeal);
        notificationService.handleAppealStatusUpdateNotification(savedAppeal, savedAppeal.getTest(), savedAppeal.getTest().getModule());
        return convertToDTO(savedAppeal);
    }
    /**
     * Recalculate the total score for a submission based on the updated question scores
     */
    private void recalculateSubmissionScore(Submission submission) {
        double totalScore = 0.0;
        int totalPoints = 0;

        // Explicitly fetch all answers for this submission to ensure completeness
        List<Answer> allAnswers = answerRepository.findBySubmissionId(submission.getId());

        System.out.println("Recalculating score with " + allAnswers.size() + " answers");

        for (Answer answer : allAnswers) {
            totalScore += answer.getScore();
            totalPoints += answer.getQuestion().getPoints();
            System.out.println("Question " + answer.getQuestion().getId() + ": " +
                    answer.getScore() + "/" + answer.getQuestion().getPoints());
        }

        double finalScore = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
        System.out.println("FULL TEST CALCULATION - Total earned: " + totalScore + "/" +
                totalPoints + " = " + finalScore + "%");
        submission.setTotalScore(finalScore);
    }

    /**
     * Get a single appeal by ID
     */
    public AppealDTO getAppealById(Long appealId) {
        User currentUser = userService.getCurrentUser();

        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found with id: " + appealId));

        // Check if the user is authorized to view this appeal
        if (currentUser.getRole() == Role.LECTURER && !appeal.getTest().getLecturer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only view appeals for your own tests");
        } else if (currentUser.getRole() == Role.STUDENT && !appeal.getSubmission().getStudent().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only view your own appeals");
        }

        return convertToDTO(appeal);
    }

    /**
     * Convert Appeal entity to DTO
     */
    private AppealDTO convertToDTO(Appeal appeal) {
        AppealDTO dto = new AppealDTO();
        dto.setId(appeal.getId());
        dto.setTestId(appeal.getTest().getId());
        dto.setTestTitle(appeal.getTest().getTitle());
        dto.setSubmissionId(appeal.getSubmission().getId());
        dto.setOriginalScore(appeal.getOriginalScore());
        dto.setRequestedScore(appeal.getRequestedScore());
        dto.setReason(appeal.getReason());
        dto.setStatus(appeal.getStatus().name());
        dto.setFeedback(appeal.getFeedback());
        dto.setCreatedAt(appeal.getCreatedAt());
        dto.setResolvedAt(appeal.getResolvedAt());
        dto.setOriginalScore(appeal.getOriginalScore());
        dto.setRequestedScore(appeal.getRequestedScore());
        dto.setUpdatedScore(appeal.getUpdatedScore());

        // Add the updated score to the DTO
        if (appeal.getStatus() == AppealStatus.APPROVED) {
            // If the appeal is approved, use the updated score
            if (appeal.getUpdatedScore() != null) {
                dto.setUpdatedScore(appeal.getUpdatedScore());
            } else {
                // Fallback to the current submission score if updatedScore is not set
                dto.setUpdatedScore(appeal.getSubmission().getTotalScore());
            }
        } else if (appeal.getStatus() == AppealStatus.REJECTED) {
            // If rejected, we still show the original score
            dto.setUpdatedScore(appeal.getOriginalScore());
        }

        // Add student information
        User student = appeal.getSubmission().getStudent();
        dto.setStudent(student.getFullName());
        dto.setStudentId(student.getId());

        // Add module information if available
        if (appeal.getTest().getModule() != null) {
            dto.setModuleCode(appeal.getTest().getModule().getCode());
        }

        // Add question information
        List<AppealQuestionDTO> questionDTOs = new ArrayList<>();
        for (AppealQuestion appealQuestion : appeal.getAppealQuestions()) {
            Question question = appealQuestion.getQuestion();
            AppealQuestionDTO questionDTO = new AppealQuestionDTO();

            questionDTO.setQuestionId(question.getId().toString());
            questionDTO.setQuestionText(question.getQuestionText());
            questionDTO.setQuestionAnswer(appealQuestion.getStudentAnswer());
            questionDTO.setPoints(question.getPoints());

            // Find the student's actual answer in the submission
            appeal.getSubmission().getAnswers().stream()
                    .filter(a -> a.getQuestion().getId().equals(question.getId()))
                    .findFirst()
                    .ifPresent(answer -> {
                        questionDTO.setQuestionAnswer(answer.getAnswerText());
                        questionDTO.setQuestionScore(answer.getScore());
                        questionDTO.setCorrectAnswer(question.getCorrectAnswer());
                        questionDTO.setQuestionType(question.getQuestionType().toString());
                        // Add the appeal status for this question if available
                        if (answer.getAppealStatus() != null) {
                            questionDTO.setStatus(answer.getAppealStatus().name());
                        }
                        // Add the appeal feedback for this question if available
                        if (answer.getAppealResponse() != null) {
                            questionDTO.setFeedback(answer.getAppealResponse());
                        }
                    });

            questionDTOs.add(questionDTO);
        }

        dto.setQuestions(questionDTOs);

        return dto;
    }
}
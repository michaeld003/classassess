package com.classassess.classassess.service;

import com.classassess.classassess.dto.SubmissionDTO;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.*;
import com.classassess.classassess.repository.AnswerRepository;
import com.classassess.classassess.repository.AppealRepository;
import com.classassess.classassess.repository.SubmissionRepository;
import com.classassess.classassess.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.classassess.classassess.model.Module;

import java.sql.SQLOutput;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final TestRepository testRepository;
    private final UserService userService;
    private final AppealRepository appealRepository;

    /**
     * Get all completed submissions for the current user
     */
    public List<SubmissionDTO> getCompletedSubmissions() {
        return submissionRepository.findByStudentAndStatus(
                        userService.getCurrentUser(), SubmissionStatus.GRADED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get detailed test results for a specific submission
     */
    public Map<String, Object> getDetailedTestResults(Long submissionId) {
        try {
            // Directly get the test by ID
            /*Test test = testRepository.findById(submissionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Test not found"));
            System.out.println("Test: " + test.getId());*/
            User currentUser = userService.getCurrentUser();
            /*System.out.println("Current user: " + currentUser);*/


            Optional<Submission> submissionOpt = submissionRepository.findById(submissionId);
            submissionOpt.ifPresent(submission -> {
                System.out.println(submission.getTest().getId());
                });

            if (submissionOpt.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "You don't have a submission for this test");
                return errorResponse;
            }

            // Use a different variable name here to avoid the collision
            Submission currentSubmission = submissionOpt.get();

            // Check if submission is graded
            if (currentSubmission.getStatus() != SubmissionStatus.GRADED) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "Test results are not available yet");
                return errorResponse;
            }

            Map<String, Object> results = new HashMap<>();
            results.put("testId", currentSubmission.getTest().getId());
            results.put("testTitle", currentSubmission.getTest().getTitle());
            results.put("totalScore", currentSubmission.getTotalScore());
            results.put("status", currentSubmission.getStatus());
            results.put("submissionDate", currentSubmission.getSubmittedAt());

            // Add appeal information if available
            Optional<Appeal> appealOpt = appealRepository.findTopBySubmissionIdOrderByCreatedAtDesc(currentSubmission.getId());            if (appealOpt.isPresent()) {
                Appeal appeal = appealOpt.get();
                Map<String, Object> appealInfo = new HashMap<>();
                appealInfo.put("id", appeal.getId());
                appealInfo.put("status", appeal.getStatus().name());
                appealInfo.put("feedback", appeal.getFeedback());
                appealInfo.put("originalScore", appeal.getOriginalScore());
                appealInfo.put("requestedScore", appeal.getRequestedScore());
                appealInfo.put("updatedScore", appeal.getUpdatedScore());
                appealInfo.put("resolvedAt", appeal.getResolvedAt());

                results.put("appeal", appealInfo);
            }

            // Get detailed answers with feedback
            List<Answer> answers = answerRepository.findBySubmissionId(currentSubmission.getId());

            // Important: Check if answers list is empty
            if (answers.isEmpty()) {
                // If no answers found, still return basic test info but with empty answers array
                results.put("answers", new ArrayList<>());
                return results;
            }

            List<Map<String, Object>> detailedAnswers = new ArrayList<>();

            for (Answer answer : answers) {
                Question question = answer.getQuestion();
                Map<String, Object> answerDetails = new HashMap<>();

                answerDetails.put("questionId", question.getId());
                answerDetails.put("questionText", question.getQuestionText());
                answerDetails.put("questionType", question.getQuestionType());
                answerDetails.put("studentAnswer", answer.getAnswerText());
                answerDetails.put("score", answer.getScore());
                answerDetails.put("points", question.getPoints());

                if (question.getQuestionType() == QuestionType.WRITTEN ||
                        question.getQuestionType() == QuestionType.SHORT_ANSWER) {
                    answerDetails.put("feedback", answer.getAiFeedback());

                    // Provide a helpful explanation instead of null or empty string
                    String correctAnswer = question.getCorrectAnswer();
                    if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
                        correctAnswer = "This question is evaluated based on relevance, accuracy, and completeness rather than matching a specific answer.";
                    }
                    answerDetails.put("correctAnswer", correctAnswer);
                }
                else if (question.getQuestionType() == QuestionType.MCQ) {
                    // For MCQs, find the correct option
                    String correctOption = question.getOptions().stream()
                            .filter(MCQOption::getIsCorrect)
                            .findFirst()
                            .map(MCQOption::getOptionText)
                            .orElse("");
                    answerDetails.put("correctAnswer", correctOption);

                    // Add all options for reference
                    List<Map<String, Object>> options = new ArrayList<>();
                    for (MCQOption option : question.getOptions()) {
                        Map<String, Object> optionMap = new HashMap<>();
                        optionMap.put("text", option.getOptionText());
                        optionMap.put("isCorrect", option.getIsCorrect());
                        options.add(optionMap);
                    }
                    answerDetails.put("options", options);
                }

                detailedAnswers.add(answerDetails);
            }

            results.put("answers", detailedAnswers);
            return results;
        } catch (Exception e) {
            // Log the error
            System.err.println("Error getting detailed test results: " + e.getMessage());
            e.printStackTrace();

            // Return an error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Unknown error");
            return errorResponse;
        }

    }
    /**
     * Check if a student has already submitted a test
     */
    public boolean hasSubmittedTest(Long testId, Long studentId) {
        return submissionRepository.existsByTestIdAndStudentIdAndStatusIn(
                testId,
                studentId,
                List.of(SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED)
        );
    }

    /**
     * Get a student's total completed tests count
     */
    public int getCompletedTestsCount() {
        User currentUser = userService.getCurrentUser();
        return submissionRepository.countByStudentAndStatus(currentUser, SubmissionStatus.GRADED);
    }

    /**
     * Get a student's overall average score across all tests
     */
    public double getOverallAverageScore() {
        User currentUser = userService.getCurrentUser();
        List<Submission> submissions = submissionRepository.findByStudentAndStatus(
                currentUser, SubmissionStatus.GRADED);

        if (submissions.isEmpty()) {
            return 0.0;
        }

        double totalScore = submissions.stream()
                .mapToDouble(Submission::getTotalScore)
                .sum();

        return totalScore / submissions.size();
    }

    private SubmissionDTO convertToDTO(Submission submission) {
        SubmissionDTO dto = new SubmissionDTO();
        dto.setId(submission.getId());
        dto.setTestId(submission.getTest().getId());
        dto.setTestTitle(submission.getTest().getTitle());
        dto.setStatus(submission.getStatus());
        dto.setTotalScore(submission.getTotalScore());
        dto.setSubmittedAt(submission.getSubmittedAt());

        if (submission.getTest().getModule() != null) {
            dto.setModuleCode(submission.getTest().getModule().getCode());
            dto.setModuleTitle(submission.getTest().getModule().getTitle());
        }

        return dto;
    }

    /**
     * Get performance summary for all modules the student is enrolled in
     */
    public Map<String, Object> getModulesPerformanceSummary() {
        User currentUser = userService.getCurrentUser();

        // Get all submissions by the current user
        List<Submission> allSubmissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(currentUser);

        // Filter to only include graded submissions
        List<Submission> gradedSubmissions = allSubmissions.stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.GRADED)
                .collect(Collectors.toList());

        // Group submissions by module
        Map<Long, List<Submission>> submissionsByModule = new HashMap<>();

        for (Submission submission : gradedSubmissions) {
            // Get module ID from the test
            Test test = submission.getTest();
            if (test != null && test.getModule() != null) {
                Long moduleId = test.getModule().getId();

                if (!submissionsByModule.containsKey(moduleId)) {
                    submissionsByModule.put(moduleId, new ArrayList<>());
                }

                submissionsByModule.get(moduleId).add(submission);
            }
        }

        // Calculate module averages and prepare response
        List<Map<String, Object>> moduleData = new ArrayList<>();
        double totalModulesScore = 0;
        int modulesWithScores = 0;

        for (Map.Entry<Long, List<Submission>> entry : submissionsByModule.entrySet()) {
            Long moduleId = entry.getKey();
            List<Submission> moduleSubmissions = entry.getValue();

            // Get the module information
            if (moduleSubmissions.isEmpty()) {
                continue;
            }

            Test firstTest = moduleSubmissions.get(0).getTest();
            Module module = firstTest.getModule();

            // Calculate average score for this module
            double moduleAverage = calculateModuleAverage(moduleSubmissions);

            // Add to overall average calculation
            totalModulesScore += moduleAverage;
            modulesWithScores++;

            // Prepare test details
            List<Map<String, Object>> testDetails = moduleSubmissions.stream()
                    .map(submission -> {
                        Map<String, Object> testMap = new HashMap<>();
                        testMap.put("id", submission.getId());
                        testMap.put("testId", submission.getTest().getId());
                        testMap.put("title", submission.getTest().getTitle());
                        testMap.put("score", submission.getTotalScore());
                        testMap.put("submittedAt", submission.getSubmittedAt());
                        return testMap;
                    })
                    .collect(Collectors.toList());

            // Create module data object
            Map<String, Object> moduleInfo = new HashMap<>();
            moduleInfo.put("id", moduleId);
            moduleInfo.put("code", module.getCode());
            moduleInfo.put("title", module.getTitle());
            moduleInfo.put("averageScore", moduleAverage);
            moduleInfo.put("testsCount", moduleSubmissions.size());
            moduleInfo.put("tests", testDetails);

            moduleData.add(moduleInfo);
        }

        // Calculate overall average
        double overallAverage = modulesWithScores > 0 ? totalModulesScore / modulesWithScores : 0.0;

        // Create final response
        Map<String, Object> result = new HashMap<>();
        result.put("overallAverage", overallAverage);
        result.put("completedModulesCount", modulesWithScores);
        result.put("totalModulesCount", submissionsByModule.size());
        result.put("modules", moduleData);

        return result;
    }

    /**
     * Calculate average score for a set of submissions
     */
    private double calculateModuleAverage(List<Submission> submissions) {
        if (submissions.isEmpty()) {
            return 0.0;
        }

        double totalScore = submissions.stream()
                .mapToDouble(submission -> submission.getTotalScore() != null ? submission.getTotalScore() : 0.0)
                .sum();

        return totalScore / submissions.size();
    }

    /**
     * Get all test submissions for a specific student in a specific module
     */
    public List<Map<String, Object>> getStudentTestsForModule(Long moduleId, Long studentId) {
        User student = userService.getUserById(studentId);

        // Find all submissions for this student where the test belongs to the specified module
        List<Submission> submissions = submissionRepository.findByStudentIdAndTestModuleId(studentId, moduleId);

        List<Map<String, Object>> results = new ArrayList<>();
        for (Submission submission : submissions) {
            Test test = submission.getTest();
            Map<String, Object> testResult = new HashMap<>();
            testResult.put("id", submission.getId());
            testResult.put("testId", test.getId());
            testResult.put("title", test.getTitle());
            testResult.put("score", submission.getTotalScore());
            testResult.put("submittedAt", submission.getSubmittedAt());
            testResult.put("status", submission.getStatus().toString());

            results.add(testResult);
        }

        return results;
    }
}
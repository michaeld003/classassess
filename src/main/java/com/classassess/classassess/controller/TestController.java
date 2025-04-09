package com.classassess.classassess.controller;

import com.classassess.classassess.dto.*;
import com.classassess.classassess.exception.ResourceNotFoundException;
import com.classassess.classassess.model.MCQOption;
import com.classassess.classassess.model.Question;
import com.classassess.classassess.model.QuestionType;
import com.classassess.classassess.model.SubmissionStatus;
import com.classassess.classassess.repository.MCQOptionRepository;
import com.classassess.classassess.repository.QuestionRepository;
import com.classassess.classassess.repository.SubmissionRepository;
import com.classassess.classassess.service.SubmissionService;
import com.classassess.classassess.service.TestService;
import com.classassess.classassess.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.classassess.classassess.model.User;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.classassess.classassess.model.Test;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {
    private final TestService testService;
    private final QuestionRepository questionRepository;
    private final MCQOptionRepository mcqOptionRepository;
    private final SubmissionService submissionService;
    private final UserService userService;

    @GetMapping("/student")
    public ResponseEntity<List<TestDTO>> getStudentTests() {
        return ResponseEntity.ok(testService.getStudentTests());
    }

    @GetMapping("/lecturer")
    public ResponseEntity<List<TestDTO>> getLecturerTests() {
        return ResponseEntity.ok(testService.getLecturerTests());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<TestDTO>> getUpcomingTests() {
        return ResponseEntity.ok(testService.getUpcomingTestsByStudent(null));
    }

    @PostMapping("")
    public ResponseEntity<TestDTO> createTest(@RequestBody TestDTO testDTO) {
        return ResponseEntity.ok(testService.createTest(testDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestDTO> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestForStudent(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitTest(
            @PathVariable Long id,
            @RequestBody TestSubmissionDTO submissionDTO) {
        // Validate that the path ID matches the body ID
        if (!id.equals(submissionDTO.getTestId())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Test ID mismatch between URL and request body"
            ));
        }
        
        testService.submitTest(submissionDTO);
        return ResponseEntity.ok(Map.of(
            "message", "Test submitted successfully",
            "testId", id
        ));
    }

    @PostMapping("/{id}/progress")
    public ResponseEntity<Map<String, Object>> saveProgress(
            @PathVariable Long id,
            @RequestBody TestSubmissionDTO submissionDTO) {
        // Validate that the path ID matches the body ID
        if (!id.equals(submissionDTO.getTestId())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Test ID mismatch between URL and request body"
            ));
        }
        
        testService.saveTestProgress(submissionDTO);
        return ResponseEntity.ok(Map.of(
            "message", "Progress saved successfully",
            "testId", id
        ));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<Map<String, Object>> getProgress(@PathVariable Long id) {
        Map<String, Object> progress = testService.getTestProgress(id);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<Map<String, Object>> getTestResults(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestResults(id));
    }

    @GetMapping("/lecturer/stats")
    public ResponseEntity<Map<String, Object>> getLecturerDashboardStats() {
        return ResponseEntity.ok(testService.getLecturerDashboardStats());
    }

    /*@GetMapping("/lecturer/appeals")
    public ResponseEntity<List<AppealDTO>> getLecturerAppeals() {
        return ResponseEntity.ok(testService.getAppealsByLecturer());
    }

    @GetMapping("/lecturer/appeals/count")
    public ResponseEntity<Map<String, Integer>> getLecturerAppealCount() {
        int count = testService.getAppealCountByLecturer();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/appeals/{id}/resolve")
    public ResponseEntity<AppealDTO> resolveAppeal(
            @PathVariable Long id,
            @RequestBody AppealResolutionDTO resolutionDTO) {
        return ResponseEntity.ok(testService.resolveAppeal(id, resolutionDTO));
    }*/

    //analytics endpoints

    @GetMapping("/lecturer/analytics")
    public ResponseEntity<AnalyticsDashboardDTO> getDashboardAnalytics() {
        return ResponseEntity.ok(testService.getDashboardAnalytics());
    }

    @GetMapping("/lecturer/analytics/performance")
    public ResponseEntity<List<ModulePerformanceDTO>> getModulePerformance() {
        return ResponseEntity.ok(testService.getModulePerformance());
    }

    @GetMapping("/lecturer/analytics/activity")
    public ResponseEntity<List<TestActivityDTO>> getTestActivity() {
        return ResponseEntity.ok(testService.getTestActivity());
    }

    @GetMapping("/lecturer/analytics/ai-confidence")
    public ResponseEntity<List<AIConfidenceDTO>> getAIConfidence() {
        return ResponseEntity.ok(testService.getAIConfidence());
    }

    @PostMapping("/modules/{moduleId}/tests")
    public ResponseEntity<TestDTO> createTestForModule(
            @PathVariable Long moduleId,
            @RequestBody TestDTO testDTO) {
        testDTO.setModuleId(moduleId);
        return ResponseEntity.ok(testService.createTest(testDTO));
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<?> getTestForStudent(@PathVariable Long id) {
        // Get the current user and time
        User currentUser = userService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        // Get the test
        Test test = testService.getTestEntity(id);

        if (test.getModule() != null && (test.getModule().getActive() == null || !test.getModule().getActive())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "This test is not available because the module is inactive",
                    "redirectTo", "/student/dashboard"
            ));
        }

        // Check if the test has already been submitted
        boolean alreadySubmitted = submissionService.hasSubmittedTest(id, currentUser.getId());
        if (alreadySubmitted) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "Test has already been submitted",
                    "redirectTo", "/student/results/" + id
            ));
        }

        // Check if test is within scheduled time window
        if (now.isBefore(test.getStartTime())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "This test is not yet available. It starts at " +
                            test.getStartTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    "redirectTo", "/student/dashboard"
            ));
        }

        if (now.isAfter(test.getEndTime())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "This test has ended. The deadline was " +
                            test.getEndTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    "redirectTo", "/student/dashboard"
            ));
        }

        // If all checks pass, proceed with returning the test
        TestDTO testDTO = testService.getTestForStudent(id);
        return ResponseEntity.ok(testDTO);
    }

    @GetMapping("/debug/question/{id}")
    public ResponseEntity<?> debugQuestion(@PathVariable Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        List<MCQOption> options = mcqOptionRepository.findByQuestionId(id);

        return ResponseEntity.ok(Map.of(
                "question", question,
                "optionsCount", options.size(),
                "options", options
        ));
    }

    @GetMapping("/{submissionId}/detailed-results")
    public ResponseEntity<Map<String, Object>> getDetailedTestResults(@PathVariable Long submissionId) {
        try {
            System.out.println("Fetching detailed results for test ID: " + submissionId);

            // Get current user for logging purposes
            User currentUser = userService.getCurrentUser();
            System.out.println("Current user ID: " + currentUser.getId());

            Map<String, Object> results = submissionService.getDetailedTestResults(submissionId);
            System.out.println("Results found: " + (results != null));
            return ResponseEntity.ok(results);
        } catch (ResourceNotFoundException e) {
            System.err.println("Test not found or access denied: " + e.getMessage());
            return ResponseEntity.status(404).body(Map.of(
                    "error", true,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            System.err.println("Error getting detailed results: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionDTO>> getTestQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getQuestionsForTest(id));
    }

    @PutMapping("/{id}/questions")
    public ResponseEntity<TestDTO> updateTestQuestions(
            @PathVariable Long id,
            @RequestBody List<QuestionDTO> questions) {
        return ResponseEntity.ok(testService.updateTestQuestions(id, questions));
    }
    @PostMapping("/{id}/questions/delete")
    public ResponseEntity<Void> deleteQuestions(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> requestBody) {

        List<Long> questionIds = requestBody.get("questionIds");
        testService.deleteQuestions(id, questionIds);
        return ResponseEntity.ok().build();
    }


    @PatchMapping("/modules/{moduleId}/tests/{testId}/cancel")
    public ResponseEntity<?> cancelTest(
            @PathVariable Long moduleId,
            @PathVariable Long testId) {
        try {
            System.out.println("Controller: Attempting to cancel test " + testId);

            // Get current user and test
            User currentUser = userService.getCurrentUser();
            Test test = testService.getTestEntity(testId);

            System.out.println("Found test with ID " + testId + ", status: " + test.getStatus());

            // Authorization check
            if (!test.getLecturer().getId().equals(currentUser.getId())) {
                System.out.println("Authorization failed - user is not the lecturer");
                return ResponseEntity.status(403).body(Map.of(
                        "error", true,
                        "message", "You don't have permission to cancel this test"
                ));
            }

            // Call the service method with try-catch to get detailed error
            try {
                testService.cancelTest(testId);
                System.out.println("Test cancelled successfully");
            } catch (Exception e) {
                System.err.println("Exception in cancelTest service method: " + e.getMessage());
                e.printStackTrace();
                throw e; // rethrow to be caught by outer handler
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test successfully cancelled"
            ));
        } catch (Exception e) {
            System.err.println("Top-level exception in cancelTest controller: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", true,
                    "message", "Failed to cancel test: " + e.getMessage()
            ));
        }
    }
}

package com.classassess.classassess.controller;

import com.classassess.classassess.dto.SubmissionDTO;
import com.classassess.classassess.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;

    @GetMapping("/completed")
    public ResponseEntity<List<SubmissionDTO>> getCompletedSubmissions() {
        return ResponseEntity.ok(submissionService.getCompletedSubmissions());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSubmissionStats() {
        return ResponseEntity.ok(Map.of(
                "completedCount", submissionService.getCompletedTestsCount(),
                "averageScore", submissionService.getOverallAverageScore()
        ));
    }

    @GetMapping("/test/{testId}/details")
    public ResponseEntity<Map<String, Object>> getDetailedTestResults(@PathVariable Long testId) {
        return ResponseEntity.ok(submissionService.getDetailedTestResults(testId));
    }

    /**
     * Get performance summary for all modules
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getModulesPerformance() {
        try {
            Map<String, Object> performanceData = submissionService.getModulesPerformanceSummary();
            return ResponseEntity.ok(performanceData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", true,
                            "message", "Error retrieving performance data: " + e.getMessage()
                    ));
        }
    }
}
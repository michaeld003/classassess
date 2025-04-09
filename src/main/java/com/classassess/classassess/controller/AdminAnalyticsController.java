package com.classassess.classassess.controller;

import com.classassess.classassess.dto.AnalyticsDashboardDTO;
import com.classassess.classassess.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class AdminAnalyticsController {
    private final TestService testService;

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDashboardDTO> getAdminAnalytics() {
        // Directly use the existing service method
        return ResponseEntity.ok(testService.getDashboardAnalytics());
    }
}
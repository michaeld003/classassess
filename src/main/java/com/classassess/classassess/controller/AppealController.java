package com.classassess.classassess.controller;

import com.classassess.classassess.dto.AppealDTO;
import com.classassess.classassess.dto.AppealResolutionDTO;
import com.classassess.classassess.service.AppealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class AppealController {
    private final AppealService appealService;

    @PostMapping("/submissions/{submissionId}/appeal")
    public ResponseEntity<AppealDTO> submitAppeal(
            @PathVariable Long submissionId,
            @RequestBody AppealDTO appealDTO) {

        AppealDTO appeal = appealService.submitAppeal(submissionId, appealDTO);
        return ResponseEntity.ok(appeal);
    }

    @GetMapping("/lecturer/appeals")
    public ResponseEntity<List<AppealDTO>> getLecturerAppeals() {
        List<AppealDTO> appeals = appealService.getAppealsForLecturer();
        return ResponseEntity.ok(appeals);
    }

    @GetMapping("/lecturer/appeals/count")
    public ResponseEntity<Map<String, Long>> getLecturerAppealCount() {
        Long count = appealService.getAppealCountForLecturer();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/appeals/{appealId}/resolve")
    public ResponseEntity<AppealDTO> resolveAppeal(
            @PathVariable Long appealId,
            @RequestBody AppealResolutionDTO resolutionDTO) {

        try {
            AppealDTO appeal = appealService.resolveAppeal(appealId, resolutionDTO);
            return ResponseEntity.ok(appeal);
        } catch (Exception e) {
            // Log the exception for server-side debugging
            System.out.println("Error resolving appeal with id: " + appealId);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

        }
    }



    @GetMapping("/appeals/{appealId}")
    public ResponseEntity<AppealDTO> getAppealById(@PathVariable Long appealId) {
        AppealDTO appeal = appealService.getAppealById(appealId);
        return ResponseEntity.ok(appeal);
    }
}
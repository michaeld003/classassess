package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardDTO {
    private List<ModulePerformanceDTO> modulePerformance;
    private List<TestActivityDTO> testActivity;
    private List<AIConfidenceDTO> aiConfidence;
}
package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class StudentDashboardDTO {
    private List<ModuleDTO> enrolledModules;
    private List<TestDTO> upcomingTests;
    private List<SubmissionDTO> pastResults;
}
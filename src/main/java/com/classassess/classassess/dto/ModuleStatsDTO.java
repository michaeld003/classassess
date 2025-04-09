package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModuleStatsDTO {
    private Long totalModules;
    private Long activeModules;
    private Long inactiveModules;
    private Long totalStudentEnrollments;
    private Long moduleWithMostStudents;
    private String mostPopularModuleCode;
}
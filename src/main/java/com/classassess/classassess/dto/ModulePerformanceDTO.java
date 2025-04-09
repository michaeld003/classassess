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
public class ModulePerformanceDTO {
    private String moduleCode;
    private String moduleTitle;
    private Double avgScore;
    private Double passingRate;
    private Integer totalStudents;
    private Integer totalSubmissions;
}
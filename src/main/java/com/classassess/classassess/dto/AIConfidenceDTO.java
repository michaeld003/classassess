package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConfidenceDTO {
    private String moduleCode;
    private String moduleTitle;
    private Double confidenceScore;
    private Integer totalGradedQuestions;
    private Integer totalAppeals;
    private Integer successfulAppeals;
}
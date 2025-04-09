package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppealResolutionDTO {
    private String status;
    private String feedback;
    private Double newScore;
    private boolean approved;

    // For single question updates
    private Long questionId;
    private Double questionScore;

    // For multiple question updates
    private Map<Long, Double> questionScores;

    public boolean isApproved() {
        return "APPROVE".equals(status) || approved;
    }
}
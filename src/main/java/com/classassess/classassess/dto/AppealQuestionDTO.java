package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppealQuestionDTO {
    private String questionId;
    private String questionText;
    private String questionAnswer;
    private String correctAnswer;
    private Double questionScore;
    private String questionType;
    private String reason; // Individual reason for each question
    private String status;
    private String feedback;
    private Integer points; // Added points field
}
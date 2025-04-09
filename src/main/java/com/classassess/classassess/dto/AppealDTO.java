package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppealDTO {
    private Long id;
    private Long testId;
    private String testTitle;
    private Long submissionId;
    private Long studentId;
    private String student;
    private String moduleCode;
    private Double originalScore;
    private Double requestedScore;
    private String reason;
    private String status;
    private String feedback;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;


    private List<AppealQuestionDTO> questions;


    private Long questionId;
    private String questionText;
    private String questionAnswer;
    private String correctAnswer;
    private Double questionScore;
    private String questionType;
    private Double updatedScore;


}
package com.classassess.classassess.dto;

import com.classassess.classassess.model.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDTO {
    private Long id;
    private Long testId;
    private String testTitle;
    private SubmissionStatus status;
    private Double totalScore;
    private LocalDateTime submittedAt;
    private String moduleCode;
    private String moduleTitle;
}
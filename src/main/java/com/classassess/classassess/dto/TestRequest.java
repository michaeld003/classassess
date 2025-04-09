package com.classassess.classassess.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TestRequest {
    private String title;
    private String description;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<QuestionDTO> questions;
    private Boolean useAIGeneration;
    private Integer aiQuestionCount;
}
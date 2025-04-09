package com.classassess.classassess.dto;

import com.classassess.classassess.model.SubmissionStatus;
import lombok.Data;
import lombok.experimental.SuperBuilder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class TestDTO {
    private Long id;
    private String title;
    private String description;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer aiQuestionCount;
    private List<QuestionDTO> questions = new ArrayList<>();
    private Integer totalPoints;
    private Boolean useAiGeneration = false;
    private String lecturerName;
    private String moduleCode;
    private Long moduleId;
    private SubmissionStatus status;
    private Double score;

    // Explicit getter and setter for useAiGeneration to ensure consistent behavior
    public Boolean getUseAiGeneration() {
        return useAiGeneration != null ? useAiGeneration : false;
    }

    public void setUseAiGeneration(Boolean useAiGeneration) {
        this.useAiGeneration = useAiGeneration != null ? useAiGeneration : false;
    }
}
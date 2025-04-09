package com.classassess.classassess.dto;

import com.classassess.classassess.model.QuestionType;
import lombok.Data;
import java.util.List;

@Data
public class QuestionDTO {
    private Long id;
    private String questionText;
    private QuestionType questionType;
    private List<MCQOptionDTO> options;
    private Integer points;
    private String correctAnswer;
    private String aiFeedback;
}
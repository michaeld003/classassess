package com.classassess.classassess.dto;

import lombok.Data;

@Data
public class MCQOptionDTO {
    private Long id;
    private String optionText;
    private Boolean isCorrect;
}
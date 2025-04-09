package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestSubmissionDTO {
    private Long testId;


    private Map<Long, String> answers;


    private List<AnswerDTO> answersList;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerDTO {
        private Long questionId;
        private String answer;
    }
}
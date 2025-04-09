package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestActivityDTO {
    private String period; // a month/date in string format
    private Integer completedTests;
    private Integer upcomingTests;
}
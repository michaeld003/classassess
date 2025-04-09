package com.classassess.classassess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for sending dashboard updates via WebSockets
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardUpdateDTO {
    private String type;
    private Long entityId;
    private String message;
    private LocalDateTime timestamp = LocalDateTime.now();
    private Object data;
}
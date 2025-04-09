package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ModuleStatusHistoryDTO {
    private Long id;
    private Long moduleId;
    private String moduleCode;
    private String changedByName;
    private String changedByRole;
    private Boolean newStatus;
    private LocalDateTime changedAt;
    private String reason;
}
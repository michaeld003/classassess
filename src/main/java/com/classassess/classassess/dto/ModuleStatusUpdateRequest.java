package com.classassess.classassess.dto;

import lombok.Data;

@Data
public class ModuleStatusUpdateRequest {
    private boolean active;
    private String reason;
}
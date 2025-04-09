package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ModuleEnrollmentResponse {
    private List<ModuleDTO> enrolledModules;
    private boolean success;
    private String message;
}
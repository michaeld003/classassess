package com.classassess.classassess.dto;

import lombok.Data;
import java.util.List;

@Data
public class ModuleEnrollmentRequest {
    private List<Long> moduleIds;
}
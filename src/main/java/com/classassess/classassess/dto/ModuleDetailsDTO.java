package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ModuleDetailsDTO {
    private ModuleDTO moduleInfo;
    private Double progress;
    private List<AnnouncementDTO> announcements;
    private List<ResourceDTO> resources;
    private List<TestDTO> tests;
}
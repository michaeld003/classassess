package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ResourceDTO {
    private Long id;
    private String title;
    private String description;
    private String type;
    private String url;
    private LocalDateTime uploadDate;
}
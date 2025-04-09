package com.classassess.classassess.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime date;
}
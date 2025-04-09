package com.classassess.classassess.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ModuleDTO {
    private Long id;
    private String title;
    private String code;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String lecturerName;
    private Long studentCount;
    private Double progress;
    private Boolean isEnrolled;
    private Boolean isAvailable;
    private Integer maxStudents;
    private Integer currentStudents;
    private String enrollmentStatus; // "NOT_ENROLLED", "ENROLLED", "FULL"
    // Optional fields for more detailed information
    private LocalDateTime enrollmentStartDate;
    private LocalDateTime enrollmentEndDate;
    private Boolean isActive;


    private Long lecturerId;

    public Long getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(Long lecturerId) {
        this.lecturerId = lecturerId;
    }

}
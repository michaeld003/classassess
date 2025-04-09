package com.classassess.classassess.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class ModuleStudentId implements Serializable {
    @Column(name = "module_id")
    private Long moduleId;

    @Column(name = "student_id")
    private Long studentId;
}
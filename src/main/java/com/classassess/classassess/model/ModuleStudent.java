package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Entity
@Table(name = "module_students")
@NoArgsConstructor
@AllArgsConstructor
public class ModuleStudent {
    @EmbeddedId
    private ModuleStudentId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("moduleId")
    @JoinColumn(name = "module_id")
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("studentId")
    @JoinColumn(name = "student_id")
    private User student;

    private Double progress = 0.0;

    public ModuleStudent(Module module, User student) {
        this.id = new ModuleStudentId(module.getId(), student.getId());
        this.module = module;
        this.student = student;
        this.progress = 0.0;
    }
}
package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "submissions")
@Data
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "total_score")
    private Double totalScore;

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.IN_PROGRESS;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers;
}
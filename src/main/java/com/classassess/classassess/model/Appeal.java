package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appeals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    private Double originalScore;
    private Double requestedScore;
    private Double updatedScore;

    @Column(length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    private AppealStatus status;

    @Column(length = 1000)
    private String feedback;

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @ManyToOne
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    @OneToMany(mappedBy = "appeal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppealQuestion> appealQuestions = new ArrayList<>();
}
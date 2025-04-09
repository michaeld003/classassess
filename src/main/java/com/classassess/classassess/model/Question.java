package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "question_text", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(name = "correct_answer")
    private String correctAnswer;

    private Integer points = 1;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MCQOption> options = new ArrayList<>(); // Initialize with empty ArrayList
}
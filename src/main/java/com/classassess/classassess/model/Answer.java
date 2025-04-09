package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "answers")
@Data
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_text")
    private String answerText;

    @Override
    public String toString() {
        return "Answer{" +
                "score=" + score +
                ", id=" + id +
                ", oldScore=" + oldScore +
                ", submission=" + submission +
                ", question=" + question +
                '}';
    }

    private Double score;

    @Column(name = "ai_feedback")
    private String aiFeedback;

    @Column(name = "review_requested")
    private Boolean reviewRequested = false;

    @Column(name = "review_comment")
    private String reviewComment;

    @Enumerated(EnumType.STRING)
    private AppealStatus appealStatus;

    @Column(length = 1000)
    private String appealReason;

    @Column(length = 1000)
    private String appealResponse;

    private Double oldScore;

    private LocalDateTime appealDate;

    private LocalDateTime appealResolvedDate;
}
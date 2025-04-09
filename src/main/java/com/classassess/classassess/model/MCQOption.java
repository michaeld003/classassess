package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "mcq_options")
@Data
public class MCQOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "option_text", nullable = false)
    private String optionText;

    @Column(name = "is_correct")
    private Boolean isCorrect = false;
}
package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "appeal_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppealQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appeal_id", nullable = false)
    private Appeal appeal;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private String studentAnswer;
    private String reason;
    private String feedback;

    @Enumerated(EnumType.STRING)
    private AppealStatus status;
}
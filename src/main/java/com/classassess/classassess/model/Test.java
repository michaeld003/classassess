package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tests")
@Data
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "use_ai_generation")
    private Boolean useAiGeneration = false;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Method to handle AI generation flag
    public Boolean getUseAiGeneration() {
        return useAiGeneration != null ? useAiGeneration : false;
    }

    public void setUseAiGeneration(Boolean useAiGeneration) {
        this.useAiGeneration = useAiGeneration != null ? useAiGeneration : false;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "total_points")
    private Integer totalPoints = 0;


    public enum TestStatus {
        ACTIVE, COMPLETED, CANCELLED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TestStatus status = TestStatus.ACTIVE;

    // Add getter and setter
    public TestStatus getStatus() {
        return status;
    }

    public void setStatus(TestStatus status) {
        this.status = status;
    }
}
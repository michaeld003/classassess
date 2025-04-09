package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@Table(name = "module_status_history")
public class ModuleStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User changedBy;

    private Boolean newStatus;

    private LocalDateTime changedAt;

    private String reason;

    public ModuleStatusHistory(Module module, User changedBy, Boolean newStatus, String reason) {
        this.module = module;
        this.changedBy = changedBy;
        this.newStatus = newStatus;
        this.changedAt = LocalDateTime.now();
        this.reason = reason;
    }
}
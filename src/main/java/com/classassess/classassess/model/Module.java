package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "modules")
public class Module {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;

    private String title;
    private String description;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id")
    private User lecturer;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL)
    private List<ModuleStudent> moduleStudents = new ArrayList<>();

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL)
    private List<Test> tests = new ArrayList<>();

    @Column(name = "is_active")
    private Boolean active = true;

    public Boolean getActive() {
        return active != null ? active : true; // Default to true if null
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    // convenience method
    public boolean isActive() {
        return Boolean.TRUE.equals(active);
    }

    @Column(name = "last_status_change")
    private LocalDateTime lastStatusChange;

    public LocalDateTime getLastStatusChange() {
        return lastStatusChange;
    }

    public void setLastStatusChange(LocalDateTime lastStatusChange) {
        this.lastStatusChange = lastStatusChange;
    }
}
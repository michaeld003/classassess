package com.classassess.classassess.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "resources")
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String type;

    private String url;

    @Column(name = "upload_date")
    private LocalDateTime uploadDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;
}
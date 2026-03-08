package com.decp.job.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "posted_by", nullable = false, length = 128)
    private String postedBy; // Firebase UID

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String company;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "job_type", nullable = false, length = 20)
    private String jobType; // FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT

    @Column(length = 255)
    private String location;

    @Column(name = "is_remote", nullable = false)
    private boolean remote = false;

    @Column(name = "salary_range", length = 100)
    private String salaryRange;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Column(name = "application_link", nullable = false, length = 1024)
    private String applicationLink;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, CLOSED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

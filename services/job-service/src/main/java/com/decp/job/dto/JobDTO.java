package com.decp.job.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class JobDTO {
    private String id;
    private String postedBy;       // Firebase UID
    private String postedByName;   // Resolved from header (best-effort)
    private String title;
    private String company;
    private String description;
    private String jobType;
    private String location;
    private boolean remote;
    private String salaryRange;
    private String requirements;
    private LocalDate applicationDeadline;
    private String applicationLink;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

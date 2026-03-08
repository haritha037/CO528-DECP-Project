package com.decp.job.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateJobRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Company is required")
    @Size(max = 255)
    private String company;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Job type is required")
    private String jobType; // FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT

    private String location;

    private boolean remote = false;

    private String salaryRange;

    private String requirements;

    private LocalDate applicationDeadline;

    @NotBlank(message = "Application link is required")
    @Size(max = 1024)
    private String applicationLink;
}

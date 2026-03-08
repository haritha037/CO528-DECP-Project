package com.decp.job.service;

import com.decp.job.dto.CreateJobRequest;
import com.decp.job.dto.JobDTO;
import com.decp.job.entity.Job;
import com.decp.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;

    @Override
    @Transactional
    public JobDTO createJob(String userId, String userName, CreateJobRequest request) {
        Job job = new Job();
        job.setPostedBy(userId);
        job.setTitle(request.getTitle());
        job.setCompany(request.getCompany());
        job.setDescription(request.getDescription());
        job.setJobType(request.getJobType());
        job.setLocation(request.getLocation());
        job.setRemote(request.isRemote());
        job.setSalaryRange(request.getSalaryRange());
        job.setRequirements(request.getRequirements());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setApplicationLink(request.getApplicationLink());
        job.setStatus("ACTIVE");
        return mapToDTO(jobRepository.save(job), userName);
    }

    @Override
    public Page<JobDTO> searchJobs(String status, String jobType, Boolean remote, String search, Pageable pageable) {
        String statusParam  = blank(status)   ? null : status;
        String typeParam    = blank(jobType)  ? null : jobType;
        String searchParam  = blank(search)   ? null : search;
        return jobRepository.searchJobs(statusParam, typeParam, remote, searchParam, pageable)
                .map(j -> mapToDTO(j, null));
    }

    @Override
    public JobDTO getJob(String jobId) {
        return mapToDTO(findJob(jobId), null);
    }

    @Override
    @Transactional
    public JobDTO updateJob(String jobId, String userId, String userRole, CreateJobRequest request) {
        Job job = findJob(jobId);
        checkOwnerOrAdmin(job, userId, userRole);
        job.setTitle(request.getTitle());
        job.setCompany(request.getCompany());
        job.setDescription(request.getDescription());
        job.setJobType(request.getJobType());
        job.setLocation(request.getLocation());
        job.setRemote(request.isRemote());
        job.setSalaryRange(request.getSalaryRange());
        job.setRequirements(request.getRequirements());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setApplicationLink(request.getApplicationLink());
        return mapToDTO(jobRepository.save(job), null);
    }

    @Override
    @Transactional
    public void deleteJob(String jobId, String userId, String userRole) {
        Job job = findJob(jobId);
        checkOwnerOrAdmin(job, userId, userRole);
        jobRepository.delete(job);
    }

    @Override
    public Page<JobDTO> getMyPosts(String userId, Pageable pageable) {
        return jobRepository.findByPostedByOrderByCreatedAtDesc(userId, pageable)
                .map(j -> mapToDTO(j, null));
    }

    @Override
    @Transactional
    public JobDTO closeJob(String jobId, String userId, String userRole) {
        Job job = findJob(jobId);
        checkOwnerOrAdmin(job, userId, userRole);
        job.setStatus("CLOSED");
        return mapToDTO(jobRepository.save(job), null);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Job findJob(String jobId) {
        try {
            return jobRepository.findById(UUID.fromString(jobId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found: " + jobId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid job ID: " + jobId);
        }
    }

    private void checkOwnerOrAdmin(Job job, String userId, String userRole) {
        if (!job.getPostedBy().equals(userId) && !"ADMIN".equals(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to modify this job posting");
        }
    }

    private boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private JobDTO mapToDTO(Job job, String posterName) {
        return JobDTO.builder()
                .id(job.getId().toString())
                .postedBy(job.getPostedBy())
                .postedByName(posterName)
                .title(job.getTitle())
                .company(job.getCompany())
                .description(job.getDescription())
                .jobType(job.getJobType())
                .location(job.getLocation())
                .remote(job.isRemote())
                .salaryRange(job.getSalaryRange())
                .requirements(job.getRequirements())
                .applicationDeadline(job.getApplicationDeadline())
                .applicationLink(job.getApplicationLink())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}

package com.decp.job.service;

import com.decp.job.dto.CreateJobRequest;
import com.decp.job.dto.JobDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface JobService {

    JobDTO createJob(String userId, String userName, CreateJobRequest request);

    Page<JobDTO> searchJobs(String status, String jobType, Boolean remote, String search, Pageable pageable);

    JobDTO getJob(String jobId);

    JobDTO updateJob(String jobId, String userId, String userRole, CreateJobRequest request);

    void deleteJob(String jobId, String userId, String userRole);

    Page<JobDTO> getMyPosts(String userId, Pageable pageable);

    JobDTO closeJob(String jobId, String userId, String userRole);

    Map<String, Object> getStats();
}

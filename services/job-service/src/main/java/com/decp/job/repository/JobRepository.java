package com.decp.job.repository;

import com.decp.job.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    @Query(value = """
        SELECT * FROM jobs j
        WHERE (CAST(:status AS text)  IS NULL OR j.status   = :status)
          AND (CAST(:jobType AS text) IS NULL OR j.job_type = :jobType)
          AND (:remote IS NULL OR j.is_remote = :remote)
          AND (CAST(:search AS text) IS NULL
               OR LOWER(j.title)   LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(j.company) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY j.created_at DESC
        """, nativeQuery = true)
    Page<Job> searchJobs(
            @Param("status")  String status,
            @Param("jobType") String jobType,
            @Param("remote")  Boolean remote,
            @Param("search")  String search,
            Pageable pageable);

    Page<Job> findByPostedByOrderByCreatedAtDesc(String postedBy, Pageable pageable);

    long countByStatus(String status);

    long countByJobType(String jobType);
}

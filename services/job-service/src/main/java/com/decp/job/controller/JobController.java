package com.decp.job.controller;

import com.decp.job.dto.CreateJobRequest;
import com.decp.job.dto.JobDTO;
import com.decp.job.security.UserPrincipal;
import com.decp.job.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ── Create ───────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ALUMNI','ADMIN')")
    public ResponseEntity<JobDTO> createJob(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @Valid @RequestBody CreateJobRequest request) {
        JobDTO job = jobService.createJob(principal.getId(), userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    // ── List / Search ────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<JobDTO>> searchJobs(
            @RequestParam(defaultValue = "ACTIVE") String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean remote,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(jobService.searchJobs(status, type, remote, search, pageable));
    }

    // ── My posts ─────────────────────────────────────────────────────────────

    @GetMapping("/my-posts")
    @PreAuthorize("hasAnyRole('ALUMNI','ADMIN')")
    public ResponseEntity<Page<JobDTO>> getMyPosts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(jobService.getMyPosts(principal.getId(), pageable));
    }

    // ── Get one ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<JobDTO> getJob(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ALUMNI','ADMIN')")
    public ResponseEntity<JobDTO> updateJob(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateJobRequest request) {
        return ResponseEntity.ok(jobService.updateJob(id, principal.getId(), principal.getRole(), request));
    }

    // ── Close ────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ALUMNI','ADMIN')")
    public ResponseEntity<JobDTO> closeJob(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.closeJob(id, principal.getId(), principal.getRole()));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ALUMNI','ADMIN')")
    public ResponseEntity<Void> deleteJob(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        jobService.deleteJob(id, principal.getId(), principal.getRole());
        return ResponseEntity.noContent().build();
    }

    // ── Stats placeholder (Phase 9) ──────────────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Object> getStats() {
        return ResponseEntity.ok(jobService.getStats());
    }
}

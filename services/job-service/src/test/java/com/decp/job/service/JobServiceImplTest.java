package com.decp.job.service;

import com.decp.job.dto.JobDTO;
import com.decp.job.entity.Job;
import com.decp.job.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceImplTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private JobServiceImpl jobService;

    @Test
    void getJob_returnsJobDTO_whenJobExists() {
        UUID jobId = UUID.randomUUID();
        Job job = new Job();
        job.setId(jobId);
        job.setTitle("Software Engineer");
        job.setCompany("Acme Corp");
        job.setStatus("ACTIVE");
        job.setPostedBy("uid-123");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        JobDTO result = jobService.getJob(jobId.toString());

        assertEquals("Software Engineer", result.getTitle());
        assertEquals("Acme Corp", result.getCompany());
        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void getJob_throwsNotFound_whenJobDoesNotExist() {
        UUID jobId = UUID.randomUUID();
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> jobService.getJob(jobId.toString()));
    }

    @Test
    void getStats_returnsCorrectCounts() {
        when(jobRepository.count()).thenReturn(15L);
        when(jobRepository.countByStatus("ACTIVE")).thenReturn(10L);
        when(jobRepository.countByStatus("CLOSED")).thenReturn(5L);
        when(jobRepository.countByJobType(any())).thenReturn(0L);

        Map<String, Object> stats = jobService.getStats();

        assertEquals(15L, stats.get("totalJobs"));
        assertEquals(10L, stats.get("activeJobs"));
        assertEquals(5L, stats.get("closedJobs"));
    }
}

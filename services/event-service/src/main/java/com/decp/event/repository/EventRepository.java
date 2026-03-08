package com.decp.event.repository;

import com.decp.event.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query(value = """
        SELECT * FROM events e
        WHERE (CAST(:status AS text)    IS NULL OR e.status     = :status)
          AND (CAST(:eventType AS text) IS NULL OR e.event_type = :eventType)
        ORDER BY e.start_time ASC
        """, nativeQuery = true)
    Page<Event> searchEvents(
            @Param("status")    String status,
            @Param("eventType") String eventType,
            Pageable pageable);

    long countByStatus(String status);
}

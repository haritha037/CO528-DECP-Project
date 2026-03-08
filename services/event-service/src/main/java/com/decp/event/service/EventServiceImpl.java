package com.decp.event.service;

import com.decp.event.config.RabbitMQConfig;
import com.decp.event.dto.*;
import com.decp.event.entity.Event;
import com.decp.event.entity.EventRsvp;
import com.decp.event.repository.EventRepository;
import com.decp.event.repository.EventRsvpRepository;
import com.decp.event.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventRsvpRepository eventRsvpRepository;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public EventDTO createEvent(CreateEventRequest req, UserPrincipal creator) {
        Event event = Event.builder()
                .createdBy(creator.getId())
                .title(req.getTitle())
                .description(req.getDescription())
                .eventType(req.getEventType())
                .location(req.getLocation())
                .online(req.isOnline())
                .onlineLink(req.getOnlineLink())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .maxAttendees(req.getMaxAttendees())
                .imageUrl(req.getImageUrl())
                .status("UPCOMING")
                .build();

        event = eventRepository.save(event);

        // Publish NEW_EVENT notification to RabbitMQ
        try {
            Map<String, Object> message = Map.of(
                    "type",          "NEW_EVENT",
                    "eventId",       event.getId().toString(),
                    "title",         event.getTitle(),
                    "startTime",     event.getStartTime().toString(),
                    "createdById",   creator.getId()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.NOTIFICATION_EXCHANGE,
                    RabbitMQConfig.ROUTING_KEY_EVENT_CREATED,
                    message);
        } catch (Exception e) {
            log.warn("Failed to publish event.created notification: {}", e.getMessage());
        }

        return toDTO(event, null);
    }

    @Override
    public Page<EventDTO> listEvents(String status, String eventType, UserPrincipal currentUser, Pageable pageable) {
        return eventRepository.searchEvents(status, eventType, pageable)
                .map(event -> {
                    String myStatus = resolveMyRsvp(event.getId(), currentUser);
                    return toDTO(event, myStatus);
                });
    }

    @Override
    public EventDTO getEvent(UUID id, UserPrincipal currentUser) {
        Event event = findOrThrow(id);
        return toDTO(event, resolveMyRsvp(id, currentUser));
    }

    @Override
    @Transactional
    public EventDTO updateEvent(UUID id, CreateEventRequest req) {
        Event event = findOrThrow(id);
        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setEventType(req.getEventType());
        event.setLocation(req.getLocation());
        event.setOnline(req.isOnline());
        event.setOnlineLink(req.getOnlineLink());
        event.setStartTime(req.getStartTime());
        event.setEndTime(req.getEndTime());
        event.setMaxAttendees(req.getMaxAttendees());
        event.setImageUrl(req.getImageUrl());
        return toDTO(eventRepository.save(event), null);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID id) {
        if (!eventRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        eventRepository.deleteById(id);
    }

    @Override
    @Transactional
    public EventDTO rsvp(UUID id, RsvpRequest req, UserPrincipal currentUser) {
        Event event = findOrThrow(id);

        EventRsvp rsvp = eventRsvpRepository.findByEventIdAndUserId(id, currentUser.getId())
                .orElseGet(() -> EventRsvp.builder()
                        .eventId(id)
                        .userId(currentUser.getId())
                        .build());
        rsvp.setStatus(req.getStatus());
        eventRsvpRepository.save(rsvp);

        return toDTO(event, req.getStatus());
    }

    @Override
    public Page<AttendeeDTO> getAttendees(UUID id, Pageable pageable) {
        if (!eventRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return eventRsvpRepository.findByEventIdAndStatusNotOrderByCreatedAtAsc(id, "NOT_GOING", pageable)
                .map(r -> new AttendeeDTO(r.getUserId(), r.getStatus(), r.getCreatedAt()));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Event findOrThrow(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private String resolveMyRsvp(UUID eventId, UserPrincipal currentUser) {
        if (currentUser == null) return null;
        return eventRsvpRepository.findByEventIdAndUserId(eventId, currentUser.getId())
                .map(EventRsvp::getStatus)
                .orElse(null);
    }

    private EventDTO toDTO(Event event, String myRsvpStatus) {
        long goingCount    = eventRsvpRepository.countByEventIdAndStatus(event.getId(), "GOING");
        long maybeCount    = eventRsvpRepository.countByEventIdAndStatus(event.getId(), "MAYBE");
        long notGoingCount = eventRsvpRepository.countByEventIdAndStatus(event.getId(), "NOT_GOING");

        return EventDTO.builder()
                .id(event.getId())
                .createdBy(event.getCreatedBy())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .location(event.getLocation())
                .online(event.isOnline())
                .onlineLink(event.getOnlineLink())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .maxAttendees(event.getMaxAttendees())
                .imageUrl(event.getImageUrl())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .goingCount(goingCount)
                .maybeCount(maybeCount)
                .notGoingCount(notGoingCount)
                .myRsvpStatus(myRsvpStatus)
                .build();
    }

    @Override
    public java.util.Map<String, Object> getStats() {
        return java.util.Map.of(
            "totalEvents",    eventRepository.count(),
            "upcoming",       eventRepository.countByStatus("UPCOMING"),
            "ongoing",        eventRepository.countByStatus("ONGOING"),
            "completed",      eventRepository.countByStatus("COMPLETED"),
            "cancelled",      eventRepository.countByStatus("CANCELLED"),
            "totalRsvps",     eventRsvpRepository.count()
        );
    }
}

package com.decp.event.service;

import com.decp.event.dto.*;
import com.decp.event.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface EventService {

    EventDTO createEvent(CreateEventRequest request, UserPrincipal creator);

    Page<EventDTO> listEvents(String status, String eventType, UserPrincipal currentUser, Pageable pageable);

    EventDTO getEvent(UUID id, UserPrincipal currentUser);

    EventDTO updateEvent(UUID id, CreateEventRequest request);

    void deleteEvent(UUID id);

    EventDTO rsvp(UUID id, RsvpRequest request, UserPrincipal currentUser);

    Page<AttendeeDTO> getAttendees(UUID id, Pageable pageable);

    Map<String, Object> getStats();
}

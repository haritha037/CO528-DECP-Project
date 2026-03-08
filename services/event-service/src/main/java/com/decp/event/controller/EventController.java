package com.decp.event.controller;

import com.decp.event.dto.*;
import com.decp.event.security.CurrentUser;
import com.decp.event.security.UserPrincipal;
import com.decp.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EventDTO createEvent(@Valid @RequestBody CreateEventRequest request,
                                @CurrentUser UserPrincipal currentUser) {
        return eventService.createEvent(request, currentUser);
    }

    @GetMapping
    public Page<EventDTO> listEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser UserPrincipal currentUser) {
        return eventService.listEvents(status, type, currentUser, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public EventDTO getEvent(@PathVariable UUID id,
                             @CurrentUser UserPrincipal currentUser) {
        return eventService.getEvent(id, currentUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EventDTO updateEvent(@PathVariable UUID id,
                                @Valid @RequestBody CreateEventRequest request) {
        return eventService.updateEvent(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
    }

    @PostMapping("/{id}/rsvp")
    public EventDTO rsvp(@PathVariable UUID id,
                         @Valid @RequestBody RsvpRequest request,
                         @CurrentUser UserPrincipal currentUser) {
        return eventService.rsvp(id, request, currentUser);
    }

    @GetMapping("/{id}/attendees")
    public Page<AttendeeDTO> getAttendees(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return eventService.getAttendees(id, PageRequest.of(page, size));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(eventService.getStats());
    }
}

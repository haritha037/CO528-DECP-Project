package com.decp.event.service;

import com.decp.event.repository.EventRepository;
import com.decp.event.repository.EventRsvpRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRsvpRepository eventRsvpRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private EventServiceImpl eventService;

    @Test
    void deleteEvent_deletesSuccessfully_whenEventExists() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.existsById(eventId)).thenReturn(true);

        assertDoesNotThrow(() -> eventService.deleteEvent(eventId));

        verify(eventRepository).deleteById(eventId);
    }

    @Test
    void deleteEvent_throwsNotFound_whenEventDoesNotExist() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.existsById(eventId)).thenReturn(false);

        assertThrows(ResponseStatusException.class,
                () -> eventService.deleteEvent(eventId));

        verify(eventRepository, never()).deleteById(any());
    }
}

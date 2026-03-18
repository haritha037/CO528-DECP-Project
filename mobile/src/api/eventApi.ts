import apiClient from './apiClient';

export interface EventDTO {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  eventType: string;
  location?: string;
  online: boolean;
  onlineLink?: string;
  startTime: string;
  endTime: string;
  maxAttendees?: number;
  imageUrl?: string;
  status: string;
  createdAt: string;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  myRsvpStatus?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  SEMINAR: 'Seminar',
  WORKSHOP: 'Workshop',
  SOCIAL: 'Social',
  CAREER_FAIR: 'Career Fair',
  ANNOUNCEMENT: 'Announcement',
  OTHER: 'Other',
};

export const eventApi = {
  listEvents: (params: {
    status?: string;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<Page<EventDTO>> =>
    apiClient.get('/api/events', { params }).then(r => r.data),

  getEvent: (id: string): Promise<EventDTO> =>
    apiClient.get(`/api/events/${id}`).then(r => r.data),

  rsvp: (id: string, status: string): Promise<EventDTO> =>
    apiClient.post(`/api/events/${id}/rsvp`, { status }).then(r => r.data),
};

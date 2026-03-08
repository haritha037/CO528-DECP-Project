import apiClient from './apiClient';

export interface UserStats {
  totalUsers: number;
  students: number;
  alumni: number;
  admins: number;
  profileComplete: number;
}

export interface PostStats {
  totalPosts: number;
  totalReactions: number;
  totalComments: number;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  fullTime: number;
  partTime: number;
  internship: number;
  contract: number;
}

export interface EventStats {
  totalEvents: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  totalRsvps: number;
}

export const analyticsApi = {
  getUserStats: (): Promise<UserStats> =>
    apiClient.get('/api/users/stats').then(r => r.data),

  getPostStats: (): Promise<PostStats> =>
    apiClient.get('/api/posts/stats').then(r => r.data),

  getJobStats: (): Promise<JobStats> =>
    apiClient.get('/api/jobs/stats').then(r => r.data),

  getEventStats: (): Promise<EventStats> =>
    apiClient.get('/api/events/stats').then(r => r.data),
};

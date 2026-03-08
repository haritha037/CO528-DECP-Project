import apiClient from './apiClient';

export interface JobDTO {
  id: string;
  postedBy: string;
  postedByName?: string;
  title: string;
  company: string;
  description: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
  location?: string;
  remote: boolean;
  salaryRange?: string;
  requirements?: string;
  applicationDeadline?: string;
  applicationLink: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  description: string;
  jobType: string;
  location?: string;
  remote?: boolean;
  salaryRange?: string;
  requirements?: string;
  applicationDeadline?: string;
  applicationLink: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME:   'Full-Time',
  PART_TIME:   'Part-Time',
  INTERNSHIP:  'Internship',
  CONTRACT:    'Contract',
};

export const jobApi = {
  searchJobs: (params: {
    status?: string;
    type?: string;
    remote?: boolean;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<Page<JobDTO>> =>
    apiClient.get('/api/jobs', { params }).then(r => r.data),

  getJob: (id: string): Promise<JobDTO> =>
    apiClient.get(`/api/jobs/${id}`).then(r => r.data),

  createJob: (data: CreateJobRequest): Promise<JobDTO> =>
    apiClient.post('/api/jobs', data).then(r => r.data),

  updateJob: (id: string, data: CreateJobRequest): Promise<JobDTO> =>
    apiClient.put(`/api/jobs/${id}`, data).then(r => r.data),

  closeJob: (id: string): Promise<JobDTO> =>
    apiClient.patch(`/api/jobs/${id}/close`).then(r => r.data),

  deleteJob: (id: string): Promise<void> =>
    apiClient.delete(`/api/jobs/${id}`).then(r => r.data),

  getMyPosts: (page = 0, size = 20): Promise<Page<JobDTO>> =>
    apiClient.get('/api/jobs/my-posts', { params: { page, size } }).then(r => r.data),
};

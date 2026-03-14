import apiClient from './apiClient';

export interface UserDTO {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  bio?: string;
  department?: string;
  batch?: string;
  profilePictureUrl?: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  roleBadge: 'blue' | 'gold' | 'red';
  linkedinUrl?: string;
  githubUrl?: string;
  initials: string;
  profileComplete: boolean;
}

export interface UpdateProfileRequest {
  name: string;
  bio?: string;
  department?: string;
  batch?: string;
  profilePictureUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const userApi = {
  getMyProfile: (): Promise<UserDTO> =>
    apiClient.get('/api/users/profile').then(r => r.data),

  updateProfile: (data: UpdateProfileRequest): Promise<UserDTO> =>
    apiClient.put('/api/users/profile', data).then(r => r.data),

  getUserByUid: (firebaseUid: string): Promise<UserDTO> =>
    apiClient.get(`/api/users/${firebaseUid}`).then(r => r.data),

  searchUsers: (params: {
    q?: string;
    role?: string;
    department?: string;
    page?: number;
    size?: number;
  }): Promise<Page<UserDTO>> =>
    apiClient.get('/api/users/search', { params }).then(r => r.data),
};

import apiClient from './apiClient';

export interface UserDTO {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  bio?: string;
  department?: string;
  graduationYear?: number;
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
  graduationYear?: number;
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

  completeProfile: (): Promise<UserDTO> =>
    apiClient.put('/api/users/profile/complete').then(r => r.data),

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

  getAllUsers: (page = 0, size = 20): Promise<Page<UserDTO>> =>
    apiClient.get('/api/users/all', { params: { page, size } }).then(r => r.data),

  changeUserRole: (firebaseUid: string, role: string): Promise<UserDTO> =>
    apiClient.put(`/api/users/${firebaseUid}/role`, { role }).then(r => r.data),

  registerUser: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department?: string;
  }): Promise<UserDTO> =>
    apiClient.post('/api/users/register', data).then(r => r.data),
};

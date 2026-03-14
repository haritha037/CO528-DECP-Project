import axios from 'axios';
import { authService } from '@/auth/FirebaseAuthService';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080',
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 handling is done at the app level via auth state
    return Promise.reject(error);
  }
);

export default apiClient;

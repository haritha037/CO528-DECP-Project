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
  
  // Debug logging
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`[API Headers] Auth: ${token ? 'Present (ends with ' + token.substring(token.length - 10) + ')' : 'Missing'}`);
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    if (error.response?.data) {
      console.error(`[API Error Data]`, JSON.stringify(error.response.data));
    }
    return Promise.reject(error);
  }
);

export default apiClient;

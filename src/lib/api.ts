import axios from 'axios';
import { ApiResponse, PaginatedResponse } from './types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', credentials),
  
  register: (userData: any) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/register', userData),
  
  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),
  
  me: () =>
    api.get<ApiResponse<any>>('/auth/me'),
};

export const gamesAPI = {
  getAll: () =>
    api.get<ApiResponse<any[]>>('/games'),
  
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/games/${id}`),
  
  getServers: (gameId: string) =>
    api.get<ApiResponse<any[]>>(`/games/${gameId}/servers`),
  
  getLeagues: (gameId: string) =>
    api.get<ApiResponse<any[]>>(`/games/${gameId}/leagues`),
};

export const itemsAPI = {
  getAll: (filters?: any) =>
    api.get<PaginatedResponse<any>>('/items', { params: filters }),
  
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/items/${id}`),
  
  create: (itemData: any) =>
    api.post<ApiResponse<any>>('/items', itemData),
  
  update: (id: string, itemData: any) =>
    api.put<ApiResponse<any>>(`/items/${id}`, itemData),
  
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/items/${id}`),
  
  uploadImages: (itemId: string, images: FormData) =>
    api.post<ApiResponse<string[]>>(`/items/${itemId}/images`, images, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const escrowAPI = {
  createTransaction: (itemId: string, paymentData: any) =>
    api.post<ApiResponse<any>>('/escrow/create', { itemId, ...paymentData }),
  
  getTransaction: (transactionId: string) =>
    api.get<ApiResponse<any>>(`/escrow/${transactionId}`),
  
  confirmDelivery: (transactionId: string) =>
    api.post<ApiResponse<any>>(`/escrow/${transactionId}/confirm`),
  
  disputeTransaction: (transactionId: string, reason: string) =>
    api.post<ApiResponse<any>>(`/escrow/${transactionId}/dispute`, { reason }),
  
  releaseEscrow: (transactionId: string) =>
    api.post<ApiResponse<any>>(`/escrow/${transactionId}/release`),
};

export const userAPI = {
  getProfile: (userId: string) =>
    api.get<ApiResponse<any>>(`/users/${userId}`),
  
  updateProfile: (userData: any) =>
    api.put<ApiResponse<any>>('/users/profile', userData),
  
  getTransactions: (filters?: any) =>
    api.get<PaginatedResponse<any>>('/users/transactions', { params: filters }),
  
  getListings: (filters?: any) =>
    api.get<PaginatedResponse<any>>('/users/listings', { params: filters }),
  
  uploadAvatar: (avatar: FormData) =>
    api.post<ApiResponse<string>>('/users/avatar', avatar, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
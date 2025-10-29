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

// Path of Exile API integration
export const pathOfExileAPI = {
  async getLeagues(): Promise<PoELeague[]> {
    try {
      const response = await fetch('https://api.pathofexile.com/leagues?&type=main', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const leagues: PoELeague[] = await response.json()
      
      // Filter and sort leagues by relevance
      return leagues
        .filter(league => {
          // Filter out leagues that have ended
          if (league.endAt) {
            const endDate = new Date(league.endAt)
            return endDate > new Date()
          }
          // Include leagues with no end date (permanent leagues)
          return true
        })
        .sort((a, b) => {
          // Sort permanent leagues (no endAt) first, then by start date (newest first)
          const aIsPermanent = !a.endAt
          const bIsPermanent = !b.endAt
          
          if (aIsPermanent && !bIsPermanent) return -1
          if (!aIsPermanent && bIsPermanent) return 1
          
          // For leagues with start dates, sort by newest first
          if (a.startAt && b.startAt) {
            return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
          }
          
          // Fallback to alphabetical order
          return a.name.localeCompare(b.name)
        })
    } catch (error) {
      console.error('Failed to fetch PoE leagues:', error)
      
      // Return fallback leagues if API fails
      return [
        {
          id: "Standard",
          name: "Standard",
          realm: "pc",
          url: "https://www.pathofexile.com/ladders/league/Standard",
          startAt: "2013-01-23T21:00:00Z",
          endAt: null,
          description: "The default game mode.",
          category: { id: "Standard" },
          rules: []
        },
        {
          id: "Hardcore",
          name: "Hardcore",
          realm: "pc",
          url: "https://www.pathofexile.com/ladders/league/Hardcore",
          startAt: "2013-01-23T21:00:00Z",
          endAt: null,
          description: "A character killed in the Hardcore league is moved to the Standard league.",
          category: { id: "Standard" },
          rules: [
            {
              id: "Hardcore",
              name: "Hardcore",
              description: "A character killed in Hardcore is moved to its parent league."
            }
          ]
        }
      ]
    }
  },

  async getPoE2Leagues(): Promise<PoE2League[]> {
    try {
      // Fetch leagues from poe2scout.com API
      const response = await fetch('/api/poe2-leagues', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if there was an error
      if (data.error) {
        console.error('PoE2 leagues API error:', data.error, data.details)
        return []
      }
      
      // Return the leagues data directly from poe2scout.com
      const leagues: PoE2League[] = data
      return leagues
      
    } catch (error) {
      console.error('Failed to fetch PoE2 leagues:', error)
      return []
    }
  },

  filterAndSortLeagues(leagues: PoELeague[]): PoELeague[] {
    return leagues
      .filter(league => {
        // Filter out leagues that have ended
        if (league.endAt) {
          const endDate = new Date(league.endAt)
          return endDate > new Date()
        }
        // Include leagues with no end date (permanent leagues)
        return true
      })
      .sort((a, b) => {
        // Sort permanent leagues (no endAt) first, then by start date (newest first)
        const aIsPermanent = !a.endAt
        const bIsPermanent = !b.endAt
        
        if (aIsPermanent && !bIsPermanent) return -1
        if (!aIsPermanent && bIsPermanent) return 1
        
        // For leagues with start dates, sort by newest first
        if (a.startAt && b.startAt) {
          return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        }
        
        // Fallback to alphabetical order
        return a.name.localeCompare(b.name)
      })
  }
}

export default api;
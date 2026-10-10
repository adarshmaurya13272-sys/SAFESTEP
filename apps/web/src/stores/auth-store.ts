import { create } from 'zustand';
import { api, ApiError } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  emergencyNote?: string | null;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // Access token may have expired (15 min) — try a silent refresh once.
      try {
        const res = await api.post('/auth/refresh');
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    set({ user: res.data, isAuthenticated: true, isLoading: false });
  },
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    set({ user: res.data, isAuthenticated: true, isLoading: false });
  },
  loginDemo: async () => {
    const res = await api.post('/auth/login', {
      email: 'demo@safestep.app',
      password: 'Demo@1234',
    });
    set({ user: res.data, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Clear local state even if the server call fails (e.g. expired token)
      if (!(error instanceof ApiError)) throw error;
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

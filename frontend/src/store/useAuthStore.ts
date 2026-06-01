import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginResponse } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  email: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (userId: number, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (userId, email) => set({ userId, email }),
      logout: () => set({ accessToken: null, refreshToken: null, userId: null, email: null }),
    }),
    {
      name: 'auth-storage', // 저장소 키 이름
      storage: createJSONStorage(() => AsyncStorage), // AsyncStorage 사용
    }
  )
);

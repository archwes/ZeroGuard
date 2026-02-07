/// <reference types="vite/client" />
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  masterPassword: string | null; // kept in memory only (not persisted)
  salt: string | null; // base64-encoded salt from server (persisted)
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      masterPassword: null,
      salt: null,

      register: async (name: string, email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Erro ao criar conta');
        }
      },

      login: async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Erro ao fazer login');
        }

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          masterPassword: password, // kept in memory for MEK derivation
          salt: data.salt, // base64 salt from server
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          masterPassword: null,
          salt: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        salt: state.salt,
        // masterPassword is NOT persisted — memory only
      }),
    }
  )
);

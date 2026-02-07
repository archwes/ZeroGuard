import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock de "banco de dados" local para desenvolvimento
const USERS_STORAGE_KEY = 'zeroguard-users';

const getUsers = (): Array<{ email: string; password: string; name: string; id: string }> => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveUser = (user: { email: string; password: string; name: string; id: string }) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const findUser = (email: string, password: string) => {
  const users = getUsers();
  return users.find(u => u.email === email && u.password === password);
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      register: async (name: string, email: string, password: string) => {
        // Simula delay de rede
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Verifica se email já existe
        const users = getUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
          throw new Error('E-mail já cadastrado');
        }

        // Cria novo usuário
        const newUser = {
          id: crypto.randomUUID(),
          name,
          email,
          password, // ⚠️ ATENÇÃO: Em produção, NUNCA armazenar senha em plain text!
        };

        saveUser(newUser);

        // Não faz login automático - usuário precisa fazer login
      },

      login: async (email: string, password: string) => {
        // Simula delay de rede
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const user = findUser(email, password);

        if (!user) {
          throw new Error('E-mail ou senha incorretos');
        }

        // Autenticação bem-sucedida
        set({ 
          user: { id: user.id, name: user.name, email: user.email },
          isAuthenticated: true 
        });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

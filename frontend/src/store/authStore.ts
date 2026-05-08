import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import type { LoginRequest, UserResponse } from '../types';

interface AuthState {
  accessToken: string | null;
  usuario: UserResponse | null;
  isAuthenticated: boolean;
  
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: string) => boolean;
  setUsuario: (usuario: UserResponse) => void; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      usuario: null,
      isAuthenticated: false,

      login: async (credentials) => {
        // 1. Obtenemos el token Y los datos del usuario desde tu API actual
        const tokenResponse = await authApi.login(credentials) as any;
        
        // 2. Guardamos el token
        set({ accessToken: tokenResponse.access_token });

        // 3. Reconstruimos el objeto usuario a partir de la respuesta del login
        const usuario = {
          id: tokenResponse.user_id,
          nombre: tokenResponse.nombre,
          email: tokenResponse.email,
          roles: [tokenResponse.rol]
        };
        
        // 4. Actualizamos el estado global
        set({
          usuario: usuario as any,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        set({
          accessToken: null,
          usuario: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        try {
          const tokenResponse = await authApi.refresh();
          set({ 
            accessToken: tokenResponse.access_token, 
            isAuthenticated: true 
          });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      hasRole: (role) => {
        const roles = get().usuario?.roles || [];
        return roles.includes(role);
      },

      setUsuario: (usuario) => {
        set({ usuario, isAuthenticated: true });
      },
    }),
    {
      name: 'authStore', // Nombre bajo el cual se guardará en localStorage
      
      // TEMPORAL: Guardamos el estado completo hasta que el backend tenga el endpoint /me.
      // Una vez implementado /me, esto debe volver a ser solo { accessToken: state.accessToken }
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        usuario: state.usuario
      }),
    }
  )
);
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
        // 1. Obtenemos el token desde la API
        const tokenResponse = await authApi.login(credentials) as any;
        
        // 2. Guardamos el token
        const token = tokenResponse.access_token;
        set({ accessToken: token });

        // 3. Decodificamos el JWT payload para sacar los roles y el ID (sub)
        let roles = [];
        let userId = 0;
        try {
          const payloadBase64 = token.split('.')[1];
          const payloadDecoded = JSON.parse(atob(payloadBase64));
          roles = payloadDecoded.roles || [];
          userId = parseInt(payloadDecoded.sub, 10);
        } catch (e) {
          console.error("Error decodificando JWT:", e);
        }

        // 4. Reconstruimos el objeto usuario a partir del token y del objeto 'user' que manda la API
        const userData = tokenResponse.user || {};
        const usuario = {
          id: userData.id || userId,
          nombre: userData.nombre || 'Usuario',
          email: userData.email || credentials.email,
          roles: userData.roles || roles
        };
        
        // 5. Actualizamos el estado global
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
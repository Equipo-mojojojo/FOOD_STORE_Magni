/** Zustand store para autenticación con persistencia. */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userId: number | null;
  nombre: string | null;
  email: string | null;
  rol: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: number, nombre: string, email: string, rol: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      nombre: null,
      email: null,
      rol: null,
      isAuthenticated: false,

      login: (token, userId, nombre, email, rol) =>
        set({
          token,
          userId,
          nombre,
          email,
          rol,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          userId: null,
          nombre: null,
          email: null,
          rol: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);

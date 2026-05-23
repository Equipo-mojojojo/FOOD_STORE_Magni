/** Instancia Axios base con interceptors JWT. */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const axiosClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Interceptor: maneja 401 (token expirado o no autenticado)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiamos la caché de sesión manualmente para evitar un loop de redirección
      // (Si no lo hacemos, App.tsx cree que seguimos logueados y nos patea al home)
      localStorage.removeItem('authStore');
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
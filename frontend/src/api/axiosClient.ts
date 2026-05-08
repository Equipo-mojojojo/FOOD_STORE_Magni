/** Instancia Axios base con interceptors JWT. */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const axiosClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: agrega token automáticamente
axiosClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem("authStore");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage corrupto, ignorar
    }
  }
  return config;
});

// Interceptor: maneja 401 (token expirado)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authStore");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

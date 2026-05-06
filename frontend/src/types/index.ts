/** Interfaces globales del sistema Food Store. */

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IngredienteCreate {
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface IngredientesFilters {
  page: number;
  per_page: number;
  search: string;
  es_alergeno: string;      // "true" | "false" | ""
  estado: string;            // "activo" | "inactivo" | "todos"
  sort_by: string;           // "nombre" | "created_at" | "updated_at"
  sort_order: string;        // "asc" | "desc"
  created_from: string;      // "YYYY-MM-DD" | ""
  created_to: string;        // "YYYY-MM-DD" | ""
  updated_from: string;      // "YYYY-MM-DD" | ""
  updated_to: string;        // "YYYY-MM-DD" | ""
  starts_with: string;       // single letter | ""
}

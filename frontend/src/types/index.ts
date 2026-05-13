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
  active_at: string | null;
  deleted_at: string | null;  // eliminación lógica (solo para backend, nunca visible)
}

export interface IngredienteCreate {
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
  activo?: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
  activo?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface BaseFilters {
  page: number;
  per_page: number;
  search: string;
  estado: string;            // "activo" | "inactivo" | "todos"
  sort_by: string;
  sort_order: string;        // "asc" | "desc"
  created_from: string;      // "YYYY-MM-DD" | ""
  created_to: string;        // "YYYY-MM-DD" | ""
  updated_from: string;      // "YYYY-MM-DD" | ""
  updated_to: string;        // "YYYY-MM-DD" | ""
  starts_with: string;       // single letter | ""
}

export interface IngredientesFilters extends BaseFilters {
  es_alergeno: string;      // "true" | "false" | ""
  estado?: string;
}

// --- CATEGORIAS ---
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  padre_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoriaTree extends Categoria {
  active_at: string | null;
  subcategorias: CategoriaTree[];
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string | null;
  padre_id?: number | null;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string | null;
  padre_id?: number | null;
  activo?: boolean;
}

// --- PRODUCTOS ---
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  stock_cantidad: number;
  disponible: boolean;
  categorias: Categoria[];
  ingredientes: Ingrediente[];
  created_at: string;
  updated_at: string;
  active_at: string | null;   // baja (reversible, visible en filtro)
}

export interface ProductoCreate {
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  stock_cantidad: number;
  disponible: boolean;
  activo?: boolean;
  categoria_ids: number[];
  ingrediente_ids: number[];
}

export interface ProductoUpdate extends Partial<ProductoCreate> {
  activo?: boolean;
}

export interface ProductosFilters extends BaseFilters {
  categoria?: number;
  disponible?: string; // "true" | "false" | ""
}

export interface CategoriasFilters extends BaseFilters {}


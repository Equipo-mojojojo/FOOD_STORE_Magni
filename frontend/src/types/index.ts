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
  es_producto_terminado: boolean;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida_id: number | null;
  unidad_medida: UnidadMedidaSimple | null;
  created_at: string;
  updated_at: string;
  active_at: string | null;
  deleted_at: string | null;
}

export interface IngredienteCreate {
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
  es_producto_terminado: boolean;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida_id: number | null;
  activo?: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
  es_producto_terminado?: boolean;
  precio_costo?: number;
  stock_actual?: number;
  stock_minimo?: number;
  unidad_medida_id?: number | null;
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

// --- UNIDADES DE MEDIDA ---
export interface UnidadMedidaSimple {
  id: number;
  nombre: string;
  simbolo: string;
  tipo: string;
  factor_conversion: number;
}

// --- PRODUCTOS ---
export interface ProductoCategoriaDetail {
  categoria: { id: number; nombre: string };
  es_principal: boolean;
}

export interface ProductoIngredienteDetail {
  ingrediente: { id: number; nombre: string; es_alergeno: boolean };
  cantidad: number;
  unidad_medida: UnidadMedidaSimple | null;
  es_removible: boolean;
}

export interface ProductoCategoriaCreate {
  categoria_id: number;
  es_principal: boolean;
}

export interface ProductoIngredienteCreate {
  ingrediente_id: number;
  cantidad: number;
  unidad_medida_id: number;
  es_removible: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  costo_total: number;
  stock_cantidad: number;
  stock_disponible: number;
  margen_ganancia: number;
  precio_sugerido: number;
  disponible: boolean;
  categorias: ProductoCategoriaDetail[];
  ingredientes: ProductoIngredienteDetail[];
  unidad_venta: UnidadMedidaSimple | null;
  created_at: string;
  updated_at: string;
  active_at: string | null;
}

export interface ProductoCreate {
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  stock_cantidad: number;
  margen_ganancia: number;
  disponible: boolean;
  activo?: boolean;
  unidad_venta_id?: number | null;
  categorias: ProductoCategoriaCreate[];
  ingredientes: ProductoIngredienteCreate[];
}

export interface ProductoUpdate extends Partial<Omit<ProductoCreate, 'categorias' | 'ingredientes'>> {
  activo?: boolean;
  categorias?: ProductoCategoriaCreate[];
  ingredientes?: ProductoIngredienteCreate[];
}

export interface ProductosFilters extends BaseFilters {
  categoria?: number;
  disponible?: string; // "true" | "false" | ""
}

export interface CategoriasFilters extends BaseFilters {}


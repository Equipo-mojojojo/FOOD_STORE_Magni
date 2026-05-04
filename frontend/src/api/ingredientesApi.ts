/** API de Ingredientes — CRUD + filtros + paginación. */
import axiosClient from "./axiosClient";
import type {
  Ingrediente,
  IngredienteCreate,
  IngredienteUpdate,
  PaginatedResponse,
  IngredientesFilters,
} from "../types";

export const ingredientesApi = {
  list: async (filters: IngredientesFilters): Promise<PaginatedResponse<Ingrediente>> => {
    const params: Record<string, string | number> = {
      page: filters.page,
      per_page: filters.per_page,
      estado: filters.estado,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    };
    if (filters.search) params.search = filters.search;
    if (filters.es_alergeno !== "") params.es_alergeno = filters.es_alergeno;

    const res = await axiosClient.get<PaginatedResponse<Ingrediente>>("/ingredientes", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Ingrediente> => {
    const res = await axiosClient.get<Ingrediente>(`/ingredientes/${id}`);
    return res.data;
  },

  create: async (data: IngredienteCreate): Promise<Ingrediente> => {
    const res = await axiosClient.post<Ingrediente>("/ingredientes", data);
    return res.data;
  },

  update: async (id: number, data: IngredienteUpdate): Promise<Ingrediente> => {
    const res = await axiosClient.put<Ingrediente>(`/ingredientes/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<Ingrediente> => {
    const res = await axiosClient.delete<Ingrediente>(`/ingredientes/${id}`);
    return res.data;
  },

  restore: async (id: number): Promise<Ingrediente> => {
    const res = await axiosClient.patch<Ingrediente>(`/ingredientes/${id}/restore`);
    return res.data;
  },
};

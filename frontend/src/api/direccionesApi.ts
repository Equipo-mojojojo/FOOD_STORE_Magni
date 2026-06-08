import axiosClient from "./axiosClient";
import type { DireccionCreate, DireccionResponse } from "../types";

export const direccionesApi = {
  listar: async (): Promise<DireccionResponse[]> => {
    const res = await axiosClient.get<DireccionResponse[]>("/direcciones");
    return res.data;
  },

  crear: async (data: DireccionCreate): Promise<DireccionResponse> => {
    const res = await axiosClient.post<DireccionResponse>("/direcciones", data);
    return res.data;
  },
};

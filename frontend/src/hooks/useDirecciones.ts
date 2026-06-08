import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { direccionesApi } from "../api/direccionesApi";
import type { DireccionCreate } from "../types";

export const useDirecciones = () => {
  return useQuery({
    queryKey: ["direcciones"],
    queryFn: direccionesApi.listar,
  });
};

export const useCrearDireccion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DireccionCreate) => direccionesApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
    },
  });
};

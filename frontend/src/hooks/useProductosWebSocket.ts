import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWsStore } from "../store/wsStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Hook para conectar al WebSocket y escuchar actualizaciones en tiempo real del catálogo de productos. */
export function useProductosWebSocket() {
  const { connect, disconnect, addListener, removeListener } = useWsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleMessage = (msg: { event: string; data: any }) => {
      if (msg.event === "PRODUCTO_UPDATED") {
        // Invalida todas las queries que comiencen con "productos"
        queryClient.invalidateQueries({ queryKey: ["productos"] });
      }
    };

    addListener(handleMessage);
    connect(API_URL);

    return () => {
      removeListener(handleMessage);
      disconnect();
    };
  }, [connect, disconnect, addListener, removeListener, queryClient]);
}

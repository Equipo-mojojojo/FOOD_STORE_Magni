import { useEffect } from "react";
import { useWsStore } from "../store/wsStore";
import type { PedidoWsMessage } from "../store/wsStore";

export type { PedidoWsMessage };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface UsePedidosWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: PedidoWsMessage) => void;
}

export function usePedidosWebSocket({
  enabled = true,
  onMessage,
}: UsePedidosWebSocketOptions = {}) {
  const { isConnected, connect, disconnect, subscribeToOrder, unsubscribeFromOrder } = useWsStore();

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    connect(API_URL, onMessage);

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect, onMessage]);

  return { isConnected, subscribeToOrder, unsubscribeFromOrder };
}

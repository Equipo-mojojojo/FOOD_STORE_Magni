import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface PedidoWsMessage {
  event: string;
  data: unknown;
}

interface UsePedidosWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: PedidoWsMessage) => void;
}

function buildWsUrl() {
  const url = new URL(API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/v1/pedidos/ws";
  url.search = "";
  return url.toString();
}

export function usePedidosWebSocket({
  enabled = true,
  onMessage,
}: UsePedidosWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentWs: WebSocket | null = null;

    const closeCleanly = (ws: WebSocket) => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(1000), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000);
      }
    };

    const connect = () => {
      if (cancelled) return;

      const ws = new WebSocket(buildWsUrl());
      currentWs = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close(1000);
          return;
        }
        retryCount = 0;
        setIsConnected(true);
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null });
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          onMessageRef.current?.(JSON.parse(event.data) as PedidoWsMessage);
        } catch {
          onMessageRef.current?.({
            event: "ERROR",
            data: { detail: "Mensaje WebSocket invalido" },
          });
        }
      };

      ws.onclose = (event) => {
        if (wsRef.current === ws) wsRef.current = null;
        currentWs = null;
        setIsConnected(false);

        if (cancelled || event.code === 1000 || event.code === 1008) return;

        retryCount += 1;
        const delay = Math.min(1000 * 2 ** retryCount, 30_000);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      setIsConnected(false);
      if (retryTimer) clearTimeout(retryTimer);
      if (currentWs) closeCleanly(currentWs);
      wsRef.current = null;
    };
  }, [enabled]);

  const subscribeToOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "subscribe-order", order_id: orderId }));
    }
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe-order", order_id: orderId }));
    }
  }, []);

  return { isConnected, subscribeToOrder, unsubscribeFromOrder };
}

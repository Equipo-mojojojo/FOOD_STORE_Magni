import { create } from "zustand";

export interface PedidoWsMessage {
  event: string;
  data: unknown;
}

interface WsState {
  isConnected: boolean;
  ws: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  connect: (apiUrl: string, onMessage?: (msg: PedidoWsMessage) => void) => void;
  disconnect: () => void;
  subscribeToOrder: (orderId: number) => void;
  unsubscribeFromOrder: (orderId: number) => void;
}

export const useWsStore = create<WsState>((set, get) => ({
  isConnected: false,
  ws: null,
  reconnectTimer: null,

  connect: (apiUrl, onMessage) => {
    const { ws: currentWs, reconnectTimer } = get();
    if (currentWs) return; // Already connecting/connected

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      set({ reconnectTimer: null });
    }

    const url = new URL(apiUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/api/v1/pedidos/ws";
    url.search = "";

    const ws = new WebSocket(url.toString());
    set({ ws });

    ws.onopen = () => {
      set({ isConnected: true });
      onMessage?.({ event: "WS_CONNECTED", data: null });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as PedidoWsMessage;
        onMessage?.(msg);
      } catch {
        onMessage?.({ event: "ERROR", data: { detail: "Mensaje WebSocket invalido" } });
      }
    };

    ws.onclose = (event) => {
      set({ isConnected: false, ws: null });
      if (event.code === 1000 || event.code === 1008) return;

      // Simple reconnect logic
      const timer = setTimeout(() => {
        get().connect(apiUrl, onMessage);
      }, 3000);
      set({ reconnectTimer: timer });
    };
  },

  disconnect: () => {
    const { ws, reconnectTimer } = get();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(1000), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000);
      }
    }
    set({ ws: null, isConnected: false, reconnectTimer: null });
  },

  subscribeToOrder: (orderId) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "subscribe-order", order_id: orderId }));
    }
  },

  unsubscribeFromOrder: (orderId) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "unsubscribe-order", order_id: orderId }));
    }
  },
}));

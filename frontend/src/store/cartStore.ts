/** Carrito de compras — persistido en localStorage con zustand persist. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Producto } from "../types";

interface CartState {
  items: CartItem[];
  addItem: (producto: Producto) => void;
  removeItem: (productoId: number) => void;
  updateCantidad: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto) => {
        set((state) => {
          const existing = state.items.find((i) => i.producto.id === producto.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.producto.id === producto.id
                  ? { ...i, cantidad: i.cantidad + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { producto, cantidad: 1 }] };
        });
      },

      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter((i) => i.producto.id !== productoId),
        }));
      },

      updateCantidad: (productoId, cantidad) => {
        if (cantidad < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.producto.id === productoId ? { ...i, cantidad } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, i) => sum + Number(i.producto.precio_base) * i.cantidad,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),
    { name: "cartStore" }
  )
);

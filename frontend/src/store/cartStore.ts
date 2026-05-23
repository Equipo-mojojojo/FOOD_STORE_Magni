import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto } from '../types';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (producto: Producto, cantidad?: number) => void;
  removeItem: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, cantidad = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.producto.id === producto.id);
          
          if (existingItem) {
            // Si ya existe, sumamos la cantidad
            return {
              items: state.items.map(item => 
                item.producto.id === producto.id 
                  ? { ...item, cantidad: item.cantidad + cantidad }
                  : item
              )
            };
          } else {
            // Si no existe, lo agregamos nuevo
            return {
              items: [...state.items, { producto, cantidad }]
            };
          }
        });
      },

      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter(item => item.producto.id !== productoId)
        }));
      },

      updateQuantity: (productoId, cantidad) => {
        set((state) => ({
          items: state.items.map(item => 
            item.producto.id === productoId 
              ? { ...item, cantidad: Math.max(1, cantidad) } // Evitamos cantidades <= 0
              : item
          )
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.producto.precio_base * item.cantidad), 0);
      }
    }),
    {
      name: 'foodstore-cart-v2', // Nombre para localStorage (v2 para limpiar cache corrupta)
    }
  )
);

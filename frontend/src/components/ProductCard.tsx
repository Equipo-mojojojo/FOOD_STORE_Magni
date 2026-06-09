import { ShoppingCart } from "lucide-react";
import type { Producto } from "../types";
import { useCartStore } from '../store/cartStore';
import { Link } from "react-router-dom";

import { toast } from "sonner";

interface ProductCardProps {
  producto: Producto;
  className?: string;
}

export default function ProductCard({ producto, className }: ProductCardProps) {
  const { addItem, items } = useCartStore();

  const inCart = items.find((i) => i.producto.id === producto.id);
  const sinStock = producto.stock_disponible === 0;
  const stockAgotado = !!inCart && inCart.cantidad >= producto.stock_disponible;
  const bloqueado = sinStock || stockAgotado;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bloqueado) return;
    addItem(producto, 1);
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  // Generamos un color consistente basado en el ID para el placeholder
  const colors = [
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
  ];
  const colorClass = colors[producto.id % colors.length];

  return (
    <Link
      to={`/producto/${producto.id}`}
      className={`group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-50 flex flex-col block ${className ?? "w-64 shrink-0 snap-start"}`}
    >
      {/* Imagen Placeholder o Real */}
      <div className={`h-40 w-full flex flex-col justify-center items-center ${colorClass} relative overflow-hidden`}>
        {producto.stock_disponible <= 5 && producto.stock_disponible > 0 && (
          <span className="absolute top-3 right-3 bg-white/90 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
            ¡Quedan {producto.stock_disponible}!
          </span>
        )}
        
        {producto.imagenes && producto.imagenes.length > 0 ? (
          <img 
            src={`http://localhost:8000${producto.imagenes[0]}`} 
            alt={producto.nombre} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <span className="text-4xl font-black opacity-20 transform -rotate-12 scale-150">
            {producto.nombre.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1 relative">
        {/* Título y Descripción */}
        <div className="mb-4 flex-1">
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-green-main transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {producto.descripcion || "Sin descripción detallada."}
          </p>
        </div>

        {/* Precio y Botón Agregar */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Precio</span>
            <span className="text-xl font-black text-gray-900">
              ${producto.precio_base}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={bloqueado}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm z-10 ${
              bloqueado
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-green-50 text-green-main hover:bg-green-main hover:text-white hover:shadow-md active:scale-95"
            }`}
            title={sinStock ? "Sin stock" : stockAgotado ? "Stock máximo alcanzado" : "Agregar al carrito"}
          >
            <ShoppingCart size={20} className="fill-current" />
          </button>
        </div>
      </div>
    </Link>
  );
}

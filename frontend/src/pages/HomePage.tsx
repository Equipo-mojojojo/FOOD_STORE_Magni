/** Home pública — catálogo de productos disponibles con carrito. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus } from "lucide-react";
import { useProductos } from "../hooks/useProductos";
import { useCartStore } from "../store/cartStore";
import type { Producto, ProductosFilters } from "../types";

const DEFAULT_FILTERS: ProductosFilters = {
  page: 1,
  per_page: 12,
  search: "",
  estado: "activo",
  sort_by: "",
  sort_order: "desc",
  created_from: "",
  created_to: "",
  updated_from: "",
  updated_to: "",
  starts_with: "",
  disponible: "true",
};

interface ProductCardProps {
  producto: Producto;
}

function ProductCard({ producto }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const inCart = items.find((i) => i.producto.id === producto.id);
  const sinStock = producto.stock_disponible === 0;
  const stockAgotado = !!inCart && inCart.cantidad >= producto.stock_disponible;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <span className="text-5xl">🍽️</span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">
            {producto.descripcion}
          </p>
        )}
        <div className="mt-auto pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-green-dark font-bold text-lg">
              ${Number(producto.precio_base).toLocaleString("es-AR")}
            </span>
            {inCart && (
              <span className="text-xs text-green-dark font-medium">
                {inCart.cantidad} en carrito
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(producto)}
            disabled={sinStock || stockAgotado}
            className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              sinStock || stockAgotado
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-green-main hover:bg-green-dark text-white"
            }`}
          >
            <Plus size={16} />
            {sinStock ? "Sin stock" : stockAgotado ? "Stock máximo" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [filters] = useState<ProductosFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useProductos(filters);
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-main to-green-dark rounded-3xl p-8 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Tus productos favoritos, <br className="hidden md:block" />
            <span className="text-yellow-banner">a un clic de distancia</span>
          </h1>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Descubrí nuestro catálogo completo de productos frescos y de alta calidad.
          </p>
          {itemCount > 0 && (
            <Link
              to="/carrito"
              className="inline-flex items-center gap-2 bg-yellow-banner text-green-dark font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              <ShoppingCart size={20} />
              Ver carrito ({itemCount} {itemCount === 1 ? "producto" : "productos"})
            </Link>
          )}
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Catálogo */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuestros Productos</h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 text-gray-500">
            No hay productos disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

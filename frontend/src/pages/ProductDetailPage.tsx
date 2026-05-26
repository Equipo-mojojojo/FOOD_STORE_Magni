import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, Loader, AlertTriangle, Info, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { productosApi } from '../api/productosApi';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cantidad, setCantidad] = useState(1);
  
  const { addItem } = useCartStore();
  const { openCart } = useUiStore();

  const { data: producto, isLoading, isError } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => productosApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4">
        <Loader size={48} className="animate-spin text-green-main" />
        <span className="text-lg font-medium">Cargando producto...</span>
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
        <p className="text-gray-500 mb-6">El producto que estás buscando no existe o no está disponible.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-green-main text-white px-6 py-3 rounded-full font-bold hover:bg-green-dark transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    // casteamos a unknown -> Producto ya que ProductoDetail y Producto son muy similares y compatibles para el carrito
    addItem(producto as any, cantidad);
    openCart();
  };

  // Color de placeholder según ID
  const colors = [
    'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  ];
  const colorClass = colors[producto.id % colors.length];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Botón Volver */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-green-main transition-colors mb-6 font-medium bg-white px-4 py-2 rounded-full shadow-sm w-fit"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Izquierdo: Imagen / Color Placeholder */}
        <div className={`md:w-1/2 min-h-[300px] md:min-h-[500px] flex items-center justify-center relative overflow-hidden ${colorClass}`}>
          <span className="text-[10rem] md:text-[15rem] font-black opacity-20 transform -rotate-12 scale-150">
            {producto.nombre.substring(0, 2).toUpperCase()}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Lado Derecho: Detalles */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
          
          <div className="flex-1">
            {/* Categorías */}
            <div className="flex flex-wrap gap-2 mb-4">
              {producto.categorias.map(cat => (
                <span key={cat.categoria.id} className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                  {cat.categoria.nombre}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              {producto.nombre}
            </h1>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {producto.descripcion || "Este producto no tiene una descripción detallada, pero te aseguramos que es riquísimo."}
            </p>

            {/* Ingredientes / Info */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-green-main" /> ¿Qué trae?
              </h3>
              
              {producto.ingredientes.length > 0 ? (
                <ul className="space-y-3">
                  {producto.ingredientes.map(ing => (
                    <li key={ing.ingrediente.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium capitalize">
                        {ing.ingrediente.nombre}
                      </span>
                      {ing.ingrediente.es_alergeno && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-danger-main bg-danger-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle size={12} /> Alérgeno
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No hay información detallada de ingredientes.</p>
              )}
            </div>
          </div>

          {/* Footer: Precio y Controles */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Precio</span>
                <span className="text-4xl font-black text-green-main">
                  ${producto.precio_base}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Selector de cantidad */}
              <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-2 sm:w-1/3">
                <button 
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-green-main transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-bold text-gray-900 w-12 text-center">
                  {cantidad}
                </span>
                <button 
                  onClick={() => setCantidad(cantidad + 1)}
                  disabled={cantidad >= producto.stock_disponible}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-green-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Botón Agregar al Carrito */}
              <button 
                onClick={handleAddToCart}
                disabled={producto.stock_disponible === 0}
                className="flex-1 bg-green-main text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 hover:bg-green-dark transition-all shadow-lg shadow-green-main/30 active:scale-95 py-4 sm:py-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
              >
                <ShoppingCart size={24} className="fill-current" />
                {producto.stock_disponible === 0 ? "Sin stock" : "Agregar al Pedido"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

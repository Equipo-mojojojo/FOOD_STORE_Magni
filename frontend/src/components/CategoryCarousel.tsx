import { ArrowRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProductos } from '../hooks/useProductos';
import ProductCard from './ProductCard';

interface CategoryCarouselProps {
  id?: string;
  categoriaId: number;
  titulo: string;
}

export default function CategoryCarousel({ id, categoriaId, titulo }: CategoryCarouselProps) {
  // Buscamos solo productos disponibles para esta categoría, máximo 10 para no saturar el home
  const { data, isLoading, isError } = useProductos({
    categoria: categoriaId,
    disponible: 'true',
    page: 1,
    per_page: 10,
    search: '',
    estado: 'activo',
    sort_by: 'nombre',
    sort_order: 'asc',
    created_from: '',
    created_to: '',
    updated_from: '',
    updated_to: '',
    starts_with: ''
  });

  const productos = data?.items || [];

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{titulo}</h2>
          <Loader size={20} className="animate-spin text-green-main ml-4" />
        </div>
        <div className="flex gap-4 overflow-hidden opacity-50">
          <div className="w-64 h-80 bg-gray-100 rounded-2xl animate-pulse shrink-0"></div>
          <div className="w-64 h-80 bg-gray-100 rounded-2xl animate-pulse shrink-0"></div>
          <div className="w-64 h-80 bg-gray-100 rounded-2xl animate-pulse shrink-0"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    console.error("CategoryCarousel error fetching for:", titulo, "id:", categoriaId);
    return null; // Si hay error fallamos en silencio para no arruinar el home, solo ocultamos el carrusel
  }

  // Si no hay productos activos en esta categoría, no renderizamos la sección
  if (productos.length === 0) {
    return null;
  }

  return (
    <section id={id} className="py-4">
      {/* Header del Carrusel */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{titulo}</h2>
          <p className="text-gray-500">Descubrí nuestras opciones</p>
        </div>
        <Link
          to={`/categoria/${categoriaId}`} // O a donde definamos la vista completa
          className="text-green-main font-medium hover:text-green-dark flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight size={18} />
        </Link>
      </div>

      {/* Contenedor del Carrusel (CSS Scroll Snap) */}
      {/* Agregamos padding-bottom para que las sombras (shadow-xl) de las cards no se corten */}
      <div className="flex overflow-x-auto gap-6 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar">
        {productos.map(producto => (
          <ProductCard key={producto.id} producto={producto} />
        ))}

        {/* Tarjeta de "Ver más" al final del carrusel si hay más productos potenciales */}
        {productos.length >= 5 && (
          <div className="w-64 shrink-0 snap-start flex items-center justify-center">
            <Link
              to={`/categoria/${categoriaId}`}
              className="flex flex-col items-center justify-center h-40 w-40 rounded-full bg-green-50 text-green-main hover:bg-green-100 hover:scale-105 transition-all duration-300"
            >
              <ArrowRight size={32} className="mb-2" />
              <span className="font-bold">Ver catálogo</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

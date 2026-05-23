import { ArrowRight, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriasApi } from "../api/categoriasApi";
import CategoryCarousel from "../components/CategoryCarousel";

export default function HomePage() {
  // Obtenemos las categorías principales para renderizar un carrusel por cada una
  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ['categorias-tree', 'activo'],
    queryFn: () => categoriasApi.listTree('activo'),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section (Ajustado para ser más compacto) */}
      <section className="bg-gradient-to-r from-green-main to-green-dark rounded-3xl p-6 md:p-10 text-center text-white shadow-lg relative overflow-hidden mt-4 mx-4 sm:mx-0">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Tus ingredientes favoritos, <br className="hidden md:block" />
            <span className="text-yellow-banner">a un clic de distancia</span>
          </h1>
          <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Descubrí nuestro catálogo completo de productos frescos y de alta calidad para tu negocio o tu casa.
          </p>
          <a href="#catalogo" className="inline-flex items-center gap-2 bg-yellow-banner text-green-dark font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-md cursor-pointer text-sm">
            Ver Productos <ArrowRight size={18} />
          </a>
        </div>
        {/* Decoración geométrica */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Carrusel de Categorías Rápidas */}
      {!isLoading && !isError && categorias && categorias.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1 snap-x px-4 sm:px-0">
          {categorias.map(cat => (
            <a 
              key={cat.id} 
              href={`#cat-${cat.id}`}
              className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-green-main transition-all rounded-full px-5 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 hover:text-green-main hover:bg-green-50 snap-start shrink-0"
            >
              {cat.nombre}
            </a>
          ))}
        </div>
      )}

      <div id="catalogo" className="px-4 sm:px-0 space-y-2">
        {/* Estado de Carga Global */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader size={48} className="animate-spin text-green-main" />
            <span className="text-lg font-medium">Preparando el catálogo...</span>
          </div>
        )}

        {/* Estado de Error Global */}
        {isError && (
          <div className="bg-red-50 text-danger-main rounded-2xl p-12 text-center border-2 border-dashed border-red-200">
            <span className="text-4xl block mb-4">🔧</span>
            <h3 className="text-lg font-medium mb-2">Ups, tuvimos un problema</h3>
            <p className="max-w-md mx-auto">
              No pudimos cargar el catálogo en este momento. Por favor, intentá de nuevo más tarde.
            </p>
          </div>
        )}

        {/* Carruseles Dinámicos */}
        {!isLoading && !isError && categorias && categorias.length > 0 && (
          <div className="space-y-4 pt-2">
            {categorias.map(categoria => (
              <CategoryCarousel 
                key={categoria.id} 
                id={`cat-${categoria.id}`}
                categoriaId={categoria.id} 
                titulo={categoria.nombre} 
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && categorias?.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
            <span className="text-4xl block mb-4">🛒</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Aún no hay productos disponibles. ¡Volvé pronto para ver las novedades!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

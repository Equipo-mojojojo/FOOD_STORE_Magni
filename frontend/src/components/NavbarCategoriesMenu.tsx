import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Tags, Loader, ChevronRight } from 'lucide-react';
import { categoriasApi } from '../api/categoriasApi';

export default function NavbarCategoriesMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch de categorías usando React Query
  // Solo pedimos las activas y con un staleTime alto para no recargar a cada rato
  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ['categorias-tree', 'activo'],
    queryFn: () => categoriasApi.listTree('activo'),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to="/" 
        className="text-gray-600 hover:text-green-main flex items-center gap-2 font-medium transition-colors py-2"
        onClick={() => setIsOpen(false)}
      >
        <Tags size={18} />
        Categorías
      </Link>

      {/* El Dropdown del Súper Menú */}
      {isOpen && (
        <div className="absolute top-full left-0 pt-2 z-50">
          <div className="bg-white shadow-xl rounded-xl border border-gray-100 min-w-[250px] py-2 transform origin-top-left transition-all duration-200">
            
            {/* Estado de Carga */}
            {isLoading && (
              <div className="p-6 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Loader size={24} className="animate-spin text-green-main" />
                <span className="text-sm font-medium">Cargando categorías...</span>
              </div>
            )}

            {/* Estado de Error */}
            {isError && (
              <div className="p-4 text-center text-sm text-danger-main">
                No pudimos cargar las categorías.
              </div>
            )}

            {/* Menú Flyout (Padres en lista, hijos al costado) */}
            {!isLoading && !isError && categorias && (
              <div className="flex flex-col">
                {categorias.map((padre) => (
                  <div key={padre.id} className="group/item relative">
                    <Link 
                      to={`/?categoria=${padre.id}`} 
                      className="w-full text-left px-5 py-2.5 hover:bg-green-50 flex items-center justify-between transition-colors text-gray-800 font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{padre.nombre}</span>
                      {padre.subcategorias?.length > 0 && (
                        <ChevronRight size={16} className="text-gray-400 group-hover/item:text-green-main transition-colors" />
                      )}
                    </Link>
                    
                    {/* Submenú Flotante (Flyout) */}
                    {padre.subcategorias && padre.subcategorias.length > 0 && (
                      <div className="absolute left-full top-0 hidden group-hover/item:block pl-1 z-50">
                        <div className="bg-white shadow-xl rounded-xl border border-gray-100 min-w-[200px] py-2">
                          {padre.subcategorias.map((sub) => (
                            <Link 
                              key={sub.id}
                              to={`/?categoria=${sub.id}`} 
                              className="block px-5 py-2 hover:bg-green-50 transition-colors text-sm text-gray-600 hover:text-green-main font-medium"
                              onClick={() => setIsOpen(false)}
                            >
                              {sub.nombre}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {categorias.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No hay categorías disponibles.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

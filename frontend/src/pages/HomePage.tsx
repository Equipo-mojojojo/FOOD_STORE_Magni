import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-main to-green-dark rounded-3xl p-8 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Tus ingredientes favoritos, <br className="hidden md:block" />
            <span className="text-yellow-banner">a un clic de distancia</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Descubrí nuestro catálogo completo de productos frescos y de alta calidad para tu negocio o tu casa.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 bg-yellow-banner text-green-dark font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg">
            Ver Productos <ArrowRight size={20} />
          </Link>
        </div>
        {/* Decoración geométrica */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Featured Section Placeholder */}
      <section id="productos">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
            <p className="text-gray-500">Lo más fresco de la semana</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
          <span className="text-4xl block mb-4">🛒</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Catálogo en construcción</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Pronto conectaremos esta sección con la base de datos para mostrar el catálogo real. ¡La vista pública ya está viva!
          </p>
        </div>
      </section>
    </div>
  );
}

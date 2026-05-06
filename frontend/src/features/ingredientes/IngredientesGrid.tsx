/** Grilla de ingredientes con 6 filtros y paginación. */
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, RotateCcw, AlertTriangle, ArrowUpDown } from "lucide-react";
import { ingredientesApi } from "../../api/ingredientesApi";
import Pagination from "../../components/Pagination";
import IngredienteForm from "./IngredienteForm";
import type { Ingrediente, IngredientesFilters, PaginatedResponse, IngredienteCreate } from "../../types";

interface Props {
  estado: "activo" | "inactivo";
}

export default function IngredientesGrid({ estado }: Props) {
  const [data, setData] = useState<PaginatedResponse<Ingrediente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IngredientesFilters>({
    page: 1,
    per_page: 10,
    search: "",
    es_alergeno: "",
    estado,
    sort_by: "nombre",
    sort_order: "asc",
    created_from: "",
    created_to: "",
    updated_from: "",
    updated_to: "",
    starts_with: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingrediente | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ingredientesApi.list(filters);
      setData(result);
    } catch (err) {
      console.error("Error cargando ingredientes:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actualizar estado cuando cambia la prop
  useEffect(() => {
    setFilters((f) => ({ ...f, estado, page: 1 }));
  }, [estado]);

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterChange = (key: keyof IngredientesFilters, value: string | number) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const handleSave = async (formData: IngredienteCreate, id?: number) => {
    if (id) {
      await ingredientesApi.update(id, formData);
    } else {
      await ingredientesApi.create(formData);
    }
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Dar de baja este ingrediente?")) return;
    await ingredientesApi.delete(id);
    fetchData();
  };

  const handleRestore = async (id: number) => {
    await ingredientesApi.restore(id);
    fetchData();
  };

  const toggleSort = (col: string) => {
    setFilters((f) => ({
      ...f,
      sort_by: col,
      sort_order: f.sort_by === col && f.sort_order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const isDeletedView = filters.estado === "inactivo";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-dark">
            {isDeletedView ? "Insumos Dados de Baja" : filters.estado === "todos" ? "Todos los Insumos" : "Insumos Activos"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDeletedView
              ? "Ingredientes eliminados. Podes reactivarlos."
              : filters.estado === "todos" ? "Vista general de todos los insumos (activos y dados de baja)." : "Gestion de ingredientes del sistema."}
          </p>
        </div>
        {!isDeletedView && (
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-green-main hover:bg-green-dark text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            Nuevo Insumo
          </button>
        )}
      </div>

      {/* Filtros Completos (8) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* 1. Buscar por nombre */}
          <div className="relative xl:col-span-2 flex flex-col justify-end">
            <Search size={16} className="absolute left-3 bottom-3 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSearch}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* 2. Filtrar por alérgeno */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.es_alergeno}
              onChange={(e) => handleFilterChange("es_alergeno", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="">Todos los insumos</option>
              <option value="true">Solo Alérgenos</option>
              <option value="false">Sin Alérgenos</option>
            </select>
          </div>

          {/* 3. Letra inicial */}
          <div className="flex flex-col justify-end">
            <input
              type="text"
              maxLength={1}
              value={filters.starts_with}
              onChange={(e) => handleFilterChange("starts_with", e.target.value)}
              placeholder="Empieza con letra..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* 4. Fecha de creación */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fecha de creación</span>
            <input
              type="date"
              value={filters.created_from}
              onChange={(e) => handleFilterChange("created_from", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* 5. Estado */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange("estado", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="activo">Solo Activos</option>
              <option value="inactivo">Solo Eliminados</option>
              <option value="todos">Mostrar Todos</option>
            </select>
          </div>

          {/* 6. Ordenar por */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange("sort_by", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="nombre">Ordenar: Nombre</option>
              <option value="created_at">Ordenar: Creación</option>
              <option value="updated_at">Ordenar: Actualización</option>
            </select>
          </div>

          {/* 7. Orden asc/desc */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange("sort_order", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>

          {/* 8. Items por página */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.per_page}
              onChange={(e) => handleFilterChange("per_page", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value={10}>10 por pág</option>
              <option value={20}>20 por pág</option>
              <option value={50}>50 por pág</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla / Grilla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-green-main border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={48} className="mb-3 opacity-50" />
            <p className="font-medium">No se encontraron ingredientes</p>
            <p className="text-sm mt-1">Intenta con otros filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-green-main transition-colors"
                    onClick={() => toggleSort("nombre")}
                  >
                    <div className="flex items-center gap-1">
                      Nombre
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Alergeno
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-green-main transition-colors"
                    onClick={() => toggleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      Creado
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item) => {
                  const isItemDeleted = item.deleted_at !== null;
                  return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-gray-50/50
                      ${isItemDeleted ? "bg-danger-light/30" : ""}
                    `}
                  >
                    <td className={`px-4 py-3 text-sm font-mono ${isItemDeleted ? "text-danger" : "text-gray-500"}`}>
                      #{item.id}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${isItemDeleted ? "text-danger line-through" : "text-gray-900"}`}>
                      {item.nombre}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isItemDeleted ? "text-danger" : "text-gray-500"}`}>
                      {item.descripcion || <span className="text-gray-300 italic">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.es_alergeno ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange/10 text-orange">
                          <AlertTriangle size={12} />
                          Alergeno
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-pale text-green-dark">
                          Seguro
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isItemDeleted ? "text-danger" : "text-gray-500"}`}>
                      {new Date(item.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isItemDeleted ? (
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-2 text-green-main hover:bg-green-pale rounded-lg transition-colors"
                            title="Reactivar"
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingItem(item); setModalOpen(true); }}
                              className="p-2 text-gray-500 hover:text-green-main hover:bg-green-pale rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-500 hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                              title="Dar de baja"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {data && (
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {/* Modal crear/editar */}
      <IngredienteForm
        isOpen={modalOpen}
        ingrediente={editingItem}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

// Re-exportar el icono para el empty state
function Package(props: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

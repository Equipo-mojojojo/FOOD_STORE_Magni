/** Grilla de ingredientes con filtros y paginación. */
import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpDown, Download, RotateCcw } from "lucide-react";
import { ingredientesApi } from "../../api/ingredientesApi";
import Pagination from "../../components/Pagination";
import IngredienteForm from "./IngredienteForm";
import type { Ingrediente, IngredientesFilters, IngredienteCreate } from "../../types";
import { useIngredientes, useCrearIngrediente, useActualizarIngrediente, useEliminarIngrediente, useRestaurarIngrediente, useDarDeBajaIngrediente } from "../../hooks/useIngredientes";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

function parseBackendDate(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function formatArgentinaDate(value: string) {
  return parseBackendDate(value).toLocaleDateString("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
  });
}

export default function IngredientesGrid() {
  const [filters, setFilters] = useState<IngredientesFilters>({
    page: 1,
    per_page: 10,
    search: "",
    es_alergeno: "",
    estado: "activo",
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

  const { data, isLoading: loading } = useIngredientes(filters);

  const crearMut = useCrearIngrediente();
  const actualizarMut = useActualizarIngrediente();
  const eliminarMut = useEliminarIngrediente();
  const darDeBajaMut = useDarDeBajaIngrediente();
  const restaurarMut = useRestaurarIngrediente();

  // Buscar mientras se escribe, con debounce para no disparar una request por tecla.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 }));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterChange = (key: keyof IngredientesFilters, value: string | number) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const handleCreatedDateChange = (value: string) => {
    setFilters((f) => ({
      ...f,
      created_from: value,
      created_to: value,
      page: 1,
    }));
  };

  const handleSave = async (formData: IngredienteCreate, id?: number) => {
    if (id) {
      await actualizarMut.mutateAsync({ id, data: formData });
    } else {
      await crearMut.mutateAsync(formData);
    }
    setModalOpen(false);
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿ELIMINAR este ingrediente? Esta acción es IRREVERSIBLE y el ingrediente desaparecerá del sistema.")) return;
    await eliminarMut.mutateAsync(id);
  };

  const handleDarDeBaja = async (id: number) => {
    if (!confirm("¿Dar de baja este ingrediente? Podrás restaurarlo después.")) return;
    await darDeBajaMut.mutateAsync(id);
  };

  const handleExportCsv = async () => {
    try {
      const blob = await ingredientesApi.exportCsv(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ingredientes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Error exportando a CSV:", err);
      alert("Error al exportar los datos.");
    }
  };

  const toggleSort = (col: string) => {
    setFilters((f) => ({
      ...f,
      sort_by: col,
      sort_order: f.sort_by === col && f.sort_order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-dark">Gestión de Ingrediente</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los ingredientes del sistema.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-green-main hover:bg-green-dark text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            Nuevo Ingrediente
          </button>
        </div>
      </div>

      {/* Filtros */}
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

          {/* Filtrar por alérgeno */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.es_alergeno}
              onChange={(e) => handleFilterChange("es_alergeno", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="">Todos (Alérgenos)</option>
              <option value="true">Solo Alérgenos</option>
              <option value="false">Sin Alérgenos</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="flex flex-col justify-end">
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange("estado", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
            >
              <option value="activo">Activos</option>
              <option value="inactivo">Dados de Baja</option>
              <option value="todos">Todos (Estado)</option>
            </select>
          </div>

          {/* 3. Fecha de creación */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Creado el día</span>
            <input
              type="date"
              value={filters.created_from}
              onChange={(e) => handleCreatedDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* 4. Ordenar por */}
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

          {/* 5. Orden asc/desc */}
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

          {/* 6. Items por página */}
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
                    Costo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tipo
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
                  const isItemDeleted = item.active_at !== null;
                  return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-gray-50/50 ${isItemDeleted ? 'bg-danger-light/10' : ''}`}
                  >
                    <td className={`px-4 py-3 text-sm font-mono ${isItemDeleted ? 'text-danger' : 'text-gray-500'}`}>
                      #{item.id}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium max-w-[150px] truncate ${isItemDeleted ? 'text-danger line-through' : 'text-gray-900'}`} title={item.nombre}>
                      {item.nombre}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${isItemDeleted ? 'text-danger' : 'text-gray-900'}`}>
                      ${item.precio_costo?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className={`font-bold ${item.stock_actual <= (item.stock_minimo || 0) ? 'text-danger' : 'text-gray-700'}`}>
                          {item.stock_actual}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Mín: {item.stock_minimo || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.es_producto_terminado ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase border border-blue-100">Venta</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-bold uppercase border border-gray-100">Insumo</span>
                      )}
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
                    <td className={`px-4 py-3 text-sm ${isItemDeleted ? 'text-danger' : 'text-gray-500'}`}>
                      {formatArgentinaDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isItemDeleted ? (
                          <>
                            <button
                              onClick={() => restaurarMut.mutateAsync(item.id)}
                              className="p-2 text-green-main hover:bg-green-pale rounded-lg transition-colors"
                              title="Restaurar"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => handleEliminar(item.id)}
                              className="p-2 text-gray-400 hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
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
                              onClick={() => handleDarDeBaja(item.id)}
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

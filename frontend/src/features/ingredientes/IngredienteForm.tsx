/** Modal para crear/editar ingrediente. */
import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import type { Ingrediente, IngredienteCreate, UnidadMedidaSimple } from "../../types";
import { productosApi } from "../../api/productosApi";

interface Props {
  isOpen: boolean;
  ingrediente: Ingrediente | null; // null = crear, object = editar
  onClose: () => void;
  onSave: (data: IngredienteCreate, id?: number) => Promise<void>;
}

export default function IngredienteForm({ isOpen, ingrediente, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esAlergeno, setEsAlergeno] = useState(false);
  const [esProductoTerminado, setEsProductoTerminado] = useState(false);
  const [precioCosto, setPrecioCosto] = useState<number>(0);
  const [stockActual, setStockActual] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(0);
  const [unidadMedidaId, setUnidadMedidaId] = useState<number | "">("");
  const [activo, setActivo] = useState(true);
  
  const [unidades, setUnidades] = useState<UnidadMedidaSimple[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
    }
  }, [isOpen]);

  const fetchUnidades = async () => {
    try {
      const data = await productosApi.getUnidadesMedida();
      setUnidades(data);
    } catch (err) {
      console.error("Error fetching units", err);
    }
  };

  useEffect(() => {
    if (ingrediente) {
      setNombre(ingrediente.nombre);
      setDescripcion(ingrediente.descripcion || "");
      setEsAlergeno(ingrediente.es_alergeno);
      setEsProductoTerminado(ingrediente.es_producto_terminado || false);
      setPrecioCosto(ingrediente.precio_costo || 0);
      setStockActual(ingrediente.stock_actual || 0);
      setStockMinimo(ingrediente.stock_minimo || 0);
      setUnidadMedidaId(ingrediente.unidad_medida_id || "");
      setActivo(ingrediente.active_at === null);
    } else {
      setNombre("");
      setDescripcion("");
      setEsAlergeno(false);
      setEsProductoTerminado(false);
      setPrecioCosto(0);
      setStockActual(0);
      setStockMinimo(0);
      setUnidadMedidaId("");
      setActivo(true);
    }
    setError("");
  }, [ingrediente, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (unidadMedidaId === "") {
      setError("La unidad de medida es obligatoria");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSave({ 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || null, 
        es_alergeno: esAlergeno,
        es_producto_terminado: esProductoTerminado,
        precio_costo: Number(precioCosto),
        stock_actual: Number(stockActual),
        stock_minimo: Number(stockMinimo),
        unidad_medida_id: Number(unidadMedidaId),
        activo 
      }, ingrediente?.id);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-green-dark">
              {ingrediente ? "Editar Insumo" : "Nuevo Insumo / Ingrediente"}
            </h2>
            <p className="text-xs text-gray-500">Define los parámetros del insumo para el cálculo de stock y costos.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-danger-light text-danger-dark px-4 py-2 rounded-lg text-sm mb-4 border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Nombre del Insumo</label>
                <span className="text-xs text-gray-400">{nombre.length}/100</span>
              </div>
              <input
                type="text"
                value={nombre}
                maxLength={100}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Harina de trigo, Queso Muzarella..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none text-sm"
                autoFocus
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={descripcion}
                maxLength={500}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales del insumo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none text-sm resize-none h-16"
              />
            </div>
          </div>

          {/* SECCIÓN 2: COSTOS Y STOCK */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Info size={16} className="text-green-main" />
              Gestión de Inventario y Costos
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidad de Medida</label>
                <select
                  value={unidadMedidaId}
                  onChange={(e) => setUnidadMedidaId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Costo (por unidad)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Actual</label>
                <input
                  type="number"
                  step="0.001"
                  value={stockActual}
                  onChange={(e) => setStockActual(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  step="0.001"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONFIGURACIÓN ADICIONAL */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">Contiene Alérgenos</span>
                <span className="text-xs text-gray-500">Marca si este insumo puede causar alergias.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={esAlergeno}
                  onChange={(e) => setEsAlergeno(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-main rounded-full peer peer-checked:bg-orange transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">Es Producto Terminado</span>
                <span className="text-xs text-gray-500">¿Se puede vender directamente al cliente?</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={esProductoTerminado}
                  onChange={(e) => setEsProductoTerminado(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-main rounded-full peer peer-checked:bg-blue-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {ingrediente && (
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">Estado Activo</span>
                  <span className="text-xs text-gray-500">{activo ? "Disponible para recetas" : "Inactivo"}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-main rounded-full peer peer-checked:bg-green-main transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-main text-white rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50 text-sm font-bold shadow-md"
            >
              {loading ? "Guardando..." : "Guardar Insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


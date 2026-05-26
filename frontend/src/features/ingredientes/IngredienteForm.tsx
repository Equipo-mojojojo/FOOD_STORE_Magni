/** Modal para crear/editar ingrediente. */
import { useState, useEffect } from "react";
import { X, Info, Package } from "lucide-react";
import type { Ingrediente, IngredienteCreate, UnidadMedidaSimple } from "../../types";
import { productosApi } from "../../api/productosApi";
import { categoriasApi } from "../../api/categoriasApi";
import { ingredientesApi } from "../../api/ingredientesApi";

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

  // Campos para auto-creación de producto cuando es insumo terminado
  const [categoriaId, setCategoriaId] = useState<number | "">("")
  const [montoExtra, setMontoExtra] = useState<number>(0);
  const [categorias, setCategorias] = useState<{id: number; nombre: string}[]>([]);
  
  const [unidades, setUnidades] = useState<UnidadMedidaSimple[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
      fetchCategorias();
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

  const fetchCategorias = async () => {
    try {
      const data = await categoriasApi.listFlat();
      setCategorias(data);
    } catch (err) {
      console.error("Error fetching categories", err);
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

      // Si es terminado, buscar el producto vinculado para pre-popular categoría y monto extra
      if (ingrediente.es_producto_terminado) {
        fetchLinkedProduct(ingrediente.id);
      } else {
        setCategoriaId("");
        setMontoExtra(0);
      }
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
      setCategoriaId("");
      setMontoExtra(0);
    }
    setError("");
  }, [ingrediente, isOpen]);

  // Buscar producto vinculado a este ingrediente (para edición)
  const fetchLinkedProduct = async (ingredienteId: number) => {
    try {
      const productosList = await productosApi.list({
        page: 1, per_page: 50, search: "", estado: "",
        sort_by: "", sort_order: "desc",
        created_from: "", created_to: "",
        updated_from: "", updated_to: "",
        starts_with: ""
      });
      // Buscar un producto que tenga este ingrediente en su receta
      const linked = productosList.items.find(p =>
        p.ingredientes?.some(pi => pi.ingrediente.id === ingredienteId)
      );
      if (linked) {
        const catPrincipal = linked.categorias?.find(c => c.es_principal) || linked.categorias?.[0];
        if (catPrincipal) setCategoriaId(catPrincipal.categoria.id);
        setMontoExtra(Number(linked.precio_base) - Number(ingrediente?.precio_costo || 0));
      }
    } catch (err) {
      console.error("Error buscando producto vinculado", err);
    }
  };

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

    // Validar campos de producto terminado
    if (esProductoTerminado) {
      if (categoriaId === "") {
        setError("Seleccioná una categoría para el producto");
        return;
      }
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

      // Si es producto terminado, crear o actualizar el producto vinculado
      if (esProductoTerminado) {
        try {
          const precioFinal = Number(precioCosto) + Number(montoExtra);
          const ingId = ingrediente?.id;

          if (ingrediente) {
            // EDICIÓN: buscar producto vinculado y actualizarlo
            const productosList = await productosApi.list({
              page: 1, per_page: 50, search: "", estado: "",
              sort_by: "", sort_order: "desc",
              created_from: "", created_to: "",
              updated_from: "", updated_to: "",
              starts_with: ""
            });
            const linked = productosList.items.find(p =>
              p.ingredientes?.some(pi => pi.ingrediente.id === ingId)
            );

            if (linked) {
              // Actualizar producto existente
              await productosApi.update(linked.id, {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                precio_base: precioFinal,
                stock_cantidad: 0,
                margen_ganancia: montoExtra > 0 ? montoExtra / Number(precioCosto || 1) : 0,
                disponible: true,
                activo: true,
                unidad_venta_id: null,
                categorias: categoriaId !== "" ? [{ categoria_id: Number(categoriaId), es_principal: true }] : [],
                ingredientes: [{
                  ingrediente_id: ingId!,
                  cantidad: 1,
                  unidad_medida_id: Number(unidadMedidaId),
                  es_removible: false
                }]
              });
            } else {
              // No había producto vinculado — crear uno nuevo
              await productosApi.create({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                precio_base: precioFinal,
                stock_cantidad: 0,
                margen_ganancia: montoExtra > 0 ? montoExtra / Number(precioCosto || 1) : 0,
                disponible: true,
                activo: true,
                unidad_venta_id: null,
                categorias: categoriaId !== "" ? [{ categoria_id: Number(categoriaId), es_principal: true }] : [],
                ingredientes: [{
                  ingrediente_id: ingId!,
                  cantidad: 1,
                  unidad_medida_id: Number(unidadMedidaId),
                  es_removible: false
                }]
              });
            }
          } else {
            // CREACIÓN: buscar el ingrediente recién creado por nombre
            const ingData = await ingredientesApi.list({
              search: nombre.trim(),
              page: 1,
              per_page: 1,
              es_alergeno: "",
              estado: "activo",
              sort_by: "created_at",
              sort_order: "desc",
              created_from: "",
              created_to: "",
              updated_from: "",
              updated_to: "",
              starts_with: ""
            });
            const nuevoIngId = ingData?.items?.[0]?.id;

            if (nuevoIngId) {
              await productosApi.create({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                precio_base: precioFinal,
                stock_cantidad: 0,
                margen_ganancia: montoExtra > 0 ? montoExtra / Number(precioCosto || 1) : 0,
                disponible: true,
                activo: true,
                unidad_venta_id: null,
                categorias: categoriaId !== "" ? [{ categoria_id: Number(categoriaId), es_principal: true }] : [],
                ingredientes: [{
                  ingrediente_id: nuevoIngId,
                  cantidad: 1,
                  unidad_medida_id: Number(unidadMedidaId),
                  es_removible: false
                }]
              });
            }
          }
        } catch (prodErr) {
          console.error("Error gestionando producto vinculado:", prodErr);
          // No bloqueamos — el insumo ya se guardó exitosamente
        }
      }

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

            {/* Sección de producto vinculado — visible siempre que sea terminado */}
            {esProductoTerminado && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Package size={16} />
                  <span className="text-sm font-bold">Producto Automático</span>
                </div>
                <p className="text-xs text-blue-600">
                  {ingrediente
                    ? "Editá la categoría y el monto extra. Al guardar, se actualizará el producto vinculado automáticamente."
                    : "Al guardar, se creará un producto de venta directa con este insumo. Solo necesitás elegir la categoría y cuánto querés sumarle al costo."
                  }
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Categoría de Tienda</label>
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Monto Extra</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={montoExtra}
                        onChange={(e) => setMontoExtra(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview del precio final */}
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                  <div className="text-xs text-gray-500">
                    Costo: <span className="font-bold text-gray-800">${Number(precioCosto).toLocaleString("es-AR")}</span>
                    {" + "}
                    Extra: <span className="font-bold text-blue-600">${Number(montoExtra).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="text-sm font-black text-green-700">
                    Precio Final: ${(Number(precioCosto) + Number(montoExtra)).toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
            )}

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


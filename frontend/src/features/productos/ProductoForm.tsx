import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { useCategoriasFlat } from "../../hooks/useCategorias";
import { useIngredientes } from "../../hooks/useIngredientes";
import { useUnidadesMedida } from "../../hooks/useUnidadesMedida";
import type { Producto, ProductoCreate, ProductoCategoriaCreate, ProductoIngredienteCreate } from "../../types";

interface Props {
  isOpen: boolean;
  producto: Producto | null;
  onClose: () => void;
  onSave: (data: ProductoCreate, id?: number) => Promise<void>;
}

export default function ProductoForm({ isOpen, producto, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<ProductoCreate>({
    nombre: "",
    descripcion: "",
    precio_base: 0,
    stock_cantidad: 0,
    margen_ganancia: 0,
    disponible: true,
    activo: true,
    unidad_venta_id: null,
    categorias: [],
    ingredientes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchCat, setSearchCat] = useState("");
  const [searchIng, setSearchIng] = useState("");

  const { data: categorias } = useCategoriasFlat();
  const { data: ingredientesData } = useIngredientes({ 
    page: 1, 
    per_page: 50, 
    search: "", 
    es_alergeno: "", 
    estado: "activo", 
    sort_by: "nombre", 
    sort_order: "asc", 
    created_from: "", 
    created_to: "", 
    updated_from: "", 
    updated_to: "", 
    starts_with: "" 
  });
  const { data: unidadesMedida } = useUnidadesMedida();

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio_base: producto.precio_base,
        stock_cantidad: producto.stock_cantidad,
        margen_ganancia: producto.margen_ganancia || 0,
        disponible: producto.disponible,
        activo: producto.active_at === null,
        unidad_venta_id: producto.unidad_venta?.id || null,
        categorias: producto.categorias.map(c => ({
          categoria_id: c.categoria.id,
          es_principal: c.es_principal
        })),
        ingredientes: producto.ingredientes.map(i => ({
          ingrediente_id: i.ingrediente.id,
          cantidad: i.cantidad,
          unidad_medida_id: i.unidad_medida?.id || 1, // fallback
          es_removible: i.es_removible
        }))
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        precio_base: 0,
        stock_cantidad: 0,
        margen_ganancia: 0,
        disponible: true,
        activo: true,
        unidad_venta_id: null,
        categorias: [],
        ingredientes: []
      });
    }
    setError("");
  }, [producto, isOpen]);

  // Cálculo de costo teórico basado en los ingredientes seleccionados
  const calculatedCosto = formData.ingredientes.reduce((total, pi) => {
    const ingInfo = ingredientesData?.items.find(i => i.id === pi.ingrediente_id);
    const unidadReceta = unidadesMedida?.find(u => u.id === pi.unidad_medida_id);

    if (ingInfo) {
      // Factores de conversión (normalizamos a la unidad base, ej: gramos o mililitros)
      const fIng = ingInfo.unidad_medida?.factor_conversion || 1;
      const fReceta = unidadReceta?.factor_conversion || 1;

      const qtyBase = pi.cantidad * fReceta;
      const priceBase = ingInfo.precio_costo / fIng;

      return total + (qtyBase * priceBase);
    }
    return total;
  }, 0);

  const precioSugerido = calculatedCosto * (1 + formData.margen_ganancia);

  if (!isOpen) return null;

  const toggleCategoria = (id: number) => {
    setFormData(prev => {
      const isSelected = prev.categorias.some(c => c.categoria_id === id);
      
      if (isSelected) {
        // Al deseleccionar, por ahora solo sacamos la que clickeó el usuario
        return { ...prev, categorias: prev.categorias.filter(c => c.categoria_id !== id) };
      } else {
        // Al seleccionar, subimos en la jerarquía para marcar a los padres
        let newCats = [...prev.categorias];
        let currentId: number | null = id;
        
        while (currentId) {
          // Si no está ya seleccionada, la agregamos
          if (!newCats.some(c => c.categoria_id === currentId)) {
            const esPrimer = newCats.length === 0;
            newCats.push({ categoria_id: currentId, es_principal: esPrimer });
          }
          
          // Buscamos el padre en la lista plana de categorías que ya tenemos cargada
          const catInfo = categorias?.find(c => c.id === currentId);
          currentId = catInfo?.padre_id || null;
        }
        
        return { ...prev, categorias: newCats };
      }
    });
  };

  const setCategoriaPrincipal = (id: number) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => ({
        ...c,
        es_principal: c.categoria_id === id
      }))
    }));
  };

  const toggleIngrediente = (id: number) => {
    setFormData(prev => {
      const exists = prev.ingredientes.find(i => i.ingrediente_id === id);
      if (exists) {
        return { ...prev, ingredientes: prev.ingredientes.filter(i => i.ingrediente_id !== id) };
      } else {
        return {
          ...prev,
          ingredientes: [
            ...prev.ingredientes,
            { ingrediente_id: id, cantidad: 1, unidad_medida_id: unidadesMedida?.[0]?.id || 1, es_removible: false }
          ]
        };
      }
    });
  };

  const updateIngrediente = (id: number, field: keyof ProductoIngredienteCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map(i => i.ingrediente_id === id ? { ...i, [field]: value } : i)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.precio_base <= 0) {
      setError("El precio base debe ser mayor a 0");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const dataToSend = {
        ...formData,
        activo: formData.disponible, // Sincronizamos activo con disponible
        descripcion: formData.descripcion?.trim() || null
      };
      await onSave(dataToSend, producto?.id);
    } catch (err: any) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {producto ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-xs text-gray-500">Configura la receta, costos y precios de venta.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-danger-light text-danger-dark px-4 py-3 rounded-lg text-sm border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Nombre del Producto</label>
                <span className="text-xs text-gray-400">{formData.nombre.length}/100</span>
              </div>
              <input
                type="text" required
                maxLength={100}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none"
                placeholder="Ej: Hamburguesa con Queso"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                <span className="text-xs text-gray-400">{(formData.descripcion || "").length}/500</span>
              </div>
              <textarea
                maxLength={500}
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none h-16 resize-none"
                placeholder="Ingredientes principales, preparación..."
              />
            </div>

            <div className="md:col-span-2 bg-green-50/30 p-4 rounded-xl border border-green-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 border-b border-green-100 pb-2 mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider">Rentabilidad y Precio</h3>
                <div className="text-[10px] text-green-600 font-medium">Cálculo basado en insumos</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Insumos</label>
                <div className="text-lg font-bold text-gray-900">${calculatedCosto.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Margen Ganancia (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.1"
                    value={formData.margen_ganancia * 100}
                    onChange={(e) => setFormData({ ...formData, margen_ganancia: Number(e.target.value) / 100 })}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm"
                  />
                  <span className="text-sm font-bold text-gray-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Sugerido</label>
                <div className="text-lg font-bold text-green-main">${precioSugerido.toFixed(2)}</div>
              </div>

              <div className="md:col-span-3 pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Final de Venta ($)</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="number" step="0.01" required
                    value={formData.precio_base}
                    onChange={(e) => setFormData({ ...formData, precio_base: Number(e.target.value) })}
                    className="flex-1 px-4 py-2.5 border-2 border-green-main rounded-xl focus:ring-4 focus:ring-green-100 outline-none text-lg font-bold text-green-800"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, precio_base: Number(precioSugerido.toFixed(2)) })}
                    className="text-[10px] bg-green-main text-white px-3 py-2 rounded-lg font-bold hover:bg-green-dark transition-colors"
                  >
                    USAR SUGERIDO
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Físico (Pre-hecho)</label>
              <div className="flex gap-2">
                <input
                  type="number" required
                  value={formData.stock_cantidad}
                  onChange={(e) => setFormData({ ...formData, stock_cantidad: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none"
                />
                <select
                  value={formData.unidad_venta_id || ""}
                  onChange={(e) => setFormData({ ...formData, unidad_venta_id: Number(e.target.value) || null })}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none text-sm bg-white"
                >
                  <option value="">Und.</option>
                  {unidadesMedida?.map(u => (
                    <option key={u.id} value={u.id}>{u.simbolo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="disponible"
                checked={formData.disponible}
                onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                className="w-4 h-4 text-green-main focus:ring-green-main border-gray-300 rounded"
              />
              <label htmlFor="disponible" className="text-sm font-medium text-gray-700">Habilitado para la venta</label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[10px]">Categorías</label>
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={searchCat}
                  onChange={(e) => setSearchCat(e.target.value)}
                  className="text-[10px] px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none w-32"
                />
              </div>
              <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50/30">
                {categorias
                  ?.filter(c => c.nombre.toLowerCase().includes(searchCat.toLowerCase()))
                  .map(c => {
                    const isSelected = formData.categorias.some(cat => cat.categoria_id === c.id);
                    const isPrincipal = formData.categorias.find(cat => cat.categoria_id === c.id)?.es_principal;

                    return (
                      <div key={c.id} className="flex flex-col gap-1 p-2 hover:bg-white rounded-lg transition-colors group">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-green-main border-green-main text-white' : 'border-gray-300 bg-white group-hover:border-green-main'}`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                          <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleCategoria(c.id)} />
                          <span className="text-sm text-gray-700">{c.nombre}</span>
                        </label>
                        {isSelected && (
                          <label className="flex items-center gap-2 ml-8 text-xs cursor-pointer">
                            <input type="radio" name="cat_principal" checked={isPrincipal || false} onChange={() => setCategoriaPrincipal(c.id)} className="text-green-main w-3 h-3" />
                            <span className="text-gray-500">Principal</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[10px]">Receta (Insumos)</label>
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={searchIng}
                  onChange={(e) => setSearchIng(e.target.value)}
                  className="text-[10px] px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none w-32"
                />
              </div>
              <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50/30">
                {ingredientesData?.items?.filter(i => i.nombre.toLowerCase().includes(searchIng.toLowerCase()))
                  .map(i => {
                    const ingredienteData = formData.ingredientes.find(ing => ing.ingrediente_id === i.id);
                    const isSelected = !!ingredienteData;

                    return (
                      <div key={i.id} className={`flex flex-col gap-2 p-2 rounded-lg transition-colors border ${isSelected ? 'bg-green-50/50 border-green-200' : 'hover:bg-white border-transparent'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-green-main border-green-main text-white' : 'border-gray-300 bg-white group-hover:border-green-main'}`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                          <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleIngrediente(i.id)} />
                          <span className="text-sm font-medium text-gray-700">{i.nombre} <span className="text-[10px] text-gray-400 font-normal">($ {i.precio_costo}/unid)</span></span>
                        </label>
                        
                        {isSelected && ingredienteData && (
                          <div className="flex flex-col gap-2 pl-8 pt-1">
                            <div className="flex gap-2">
                              <input 
                                type="number" step="any"
                                value={ingredienteData.cantidad}
                                onChange={(e) => updateIngrediente(i.id, 'cantidad', Number(e.target.value))}
                                className="w-20 text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none"
                              />
                              <select 
                                value={ingredienteData.unidad_medida_id}
                                onChange={(e) => updateIngrediente(i.id, 'unidad_medida_id', Number(e.target.value))}
                                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none bg-white"
                              >
                                {unidadesMedida?.map(u => (
                                  <option key={u.id} value={u.id}>{u.simbolo}</option>
                                ))}
                              </select>
                            </div>
                            <label className="flex items-center gap-2 text-xs cursor-pointer w-fit">
                              <input type="checkbox" checked={ingredienteData.es_removible} onChange={(e) => updateIngrediente(i.id, 'es_removible', e.target.checked)} className="w-3 h-3 rounded text-green-main" />
                              <span className="text-gray-500">Removible</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-100 py-4 mt-auto">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-green-main text-white font-bold rounded-lg hover:bg-green-dark shadow-md disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

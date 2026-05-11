import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { useCategoriasFlat } from "../../hooks/useCategorias";
import { useIngredientes } from "../../hooks/useIngredientes";
import type { Producto, ProductoCreate } from "../../types";

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
    disponible: true,
    categoria_ids: [],
    ingrediente_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [searchCat, setSearchCat] = useState("");
  const [searchIng, setSearchIng] = useState("");

  const { data: categorias } = useCategoriasFlat();
  const { data: ingredientesData } = useIngredientes({ page: 1, per_page: 50, search: "", es_alergeno: "", estado: "activo", sort_by: "nombre", sort_order: "asc", created_from: "", created_to: "", updated_from: "", updated_to: "", starts_with: "" });

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio_base: producto.precio_base,
        stock_cantidad: producto.stock_cantidad,
        disponible: producto.disponible,
        categoria_ids: producto.categorias.map(c => c.id),
        ingrediente_ids: producto.ingredientes.map(i => i.id)
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        precio_base: 0,
        stock_cantidad: 0,
        disponible: true,
        categoria_ids: [],
        ingrediente_ids: []
      });
    }
  }, [producto, isOpen]);

  if (!isOpen) return null;

  const toggleSelection = (list: number[], id: number) => {
    return list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, producto?.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {producto ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto</label>
              <input
                type="text" required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none"
                placeholder="Ej: Hamburguesa con Queso"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none h-20 resize-none"
                placeholder="Ingredientes principales, preparación..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Base ($)</label>
              <input
                type="number" step="0.01" required
                value={formData.precio_base}
                onChange={(e) => setFormData({ ...formData, precio_base: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Inicial</label>
              <input
                type="number" required
                value={formData.stock_cantidad}
                onChange={(e) => setFormData({ ...formData, stock_cantidad: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-main outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="disponible"
              checked={formData.disponible}
              onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
              className="w-4 h-4 text-green-main focus:ring-green-main border-gray-300 rounded"
            />
            <label htmlFor="disponible" className="text-sm font-medium text-gray-700">Producto disponible para la venta</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[10px]">Categorías</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={searchCat}
                    onChange={(e) => setSearchCat(e.target.value)}
                    className="text-[10px] px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none w-32"
                  />
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50/30">
                {categorias
                  ?.filter(c => {
                    const term = searchCat.trim().toLowerCase();
                    return c.nombre.toLowerCase().includes(term) || 
                           (c.descripcion?.toLowerCase().includes(term) ?? false);
                  })
                  .map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      formData.categoria_ids.includes(c.id) ? 'bg-green-main border-green-main text-white' : 'border-gray-300 bg-white group-hover:border-green-main'
                    }`}>
                      {formData.categoria_ids.includes(c.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox" className="hidden"
                      checked={formData.categoria_ids.includes(c.id)}
                      onChange={() => setFormData({ ...formData, categoria_ids: toggleSelection(formData.categoria_ids, c.id) })}
                    />
                    <span className="text-sm text-gray-700">{c.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[10px]">Ingredientes / Insumos</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={searchIng}
                    onChange={(e) => setSearchIng(e.target.value)}
                    className="text-[10px] px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-main outline-none w-32"
                  />
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50/30">
                {ingredientesData?.items
                  .filter(i => {
                    const term = searchIng.trim().toLowerCase();
                    return i.nombre.toLowerCase().includes(term) || 
                           (i.descripcion?.toLowerCase().includes(term) ?? false);
                  })
                  .map(i => (
                  <label key={i.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      formData.ingrediente_ids.includes(i.id) ? 'bg-green-main border-green-main text-white' : 'border-gray-300 bg-white group-hover:border-green-main'
                    }`}>
                      {formData.ingrediente_ids.includes(i.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox" className="hidden"
                      checked={formData.ingrediente_ids.includes(i.id)}
                      onChange={() => setFormData({ ...formData, ingrediente_ids: toggleSelection(formData.ingrediente_ids, i.id) })}
                    />
                    <span className="text-sm text-gray-700">{i.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-100 py-4 mt-auto">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-main text-white font-semibold rounded-lg hover:bg-green-dark shadow-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

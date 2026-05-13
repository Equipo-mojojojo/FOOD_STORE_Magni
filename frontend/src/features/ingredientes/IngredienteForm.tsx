/** Modal para crear/editar ingrediente. */
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Ingrediente, IngredienteCreate } from "../../types";

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
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ingrediente) {
      setNombre(ingrediente.nombre);
      setDescripcion(ingrediente.descripcion || "");
      setEsAlergeno(ingrediente.es_alergeno);
      setActivo(ingrediente.active_at === null);
    } else {
      setNombre("");
      setDescripcion("");
      setEsAlergeno(false);
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
    setLoading(true);
    setError("");
    try {
      await onSave({ 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || null, 
        es_alergeno: esAlergeno,
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-green-dark">
            {ingrediente ? "Editar Ingrediente" : "Nuevo Ingrediente"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-danger-light text-danger-dark px-4 py-2 rounded-lg text-sm mb-4 border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <span className="text-xs text-gray-400">{nombre.length}/100</span>
            </div>
            <input
              type="text"
              value={nombre}
              maxLength={100}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Harina de trigo"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none text-sm"
              autoFocus
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <span className="text-xs text-gray-400">{descripcion.length}/500</span>
            </div>
            <textarea
              value={descripcion}
              maxLength={500}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Harina de fuerza para panes"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none text-sm resize-none h-20"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={esAlergeno}
                  onChange={(e) => setEsAlergeno(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-main rounded-full peer peer-checked:bg-orange transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <span className="text-sm text-gray-700">Es alergeno</span>
            </div>

            {ingrediente && (
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-main rounded-full peer peer-checked:bg-green-main transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">Estado del Ingrediente</span>
                  <span className="text-xs text-gray-500">
                    {activo ? "Activo y disponible" : "Dado de baja (no disponible)"}
                  </span>
                </div>
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
              className="flex-1 px-4 py-2.5 bg-green-main text-white rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

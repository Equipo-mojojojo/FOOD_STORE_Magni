import { useState } from "react";
import { useDirecciones, useCrearDireccion } from "../hooks/useDirecciones";
import { MapPin } from "lucide-react";
import type { DireccionCreate } from "../types";

export default function MisDireccionesPage() {
  const { data: direcciones, isLoading } = useDirecciones();
  const crearDireccion = useCrearDireccion();

  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [nuevaDireccionForm, setNuevaDireccionForm] = useState({
    alias: "",
    calle: "",
    altura: "",
    linea2: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
    es_principal: false,
  });

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mis Direcciones</h1>
        <button
          onClick={() => setMostrarNueva(!mostrarNueva)}
          className="bg-green-main text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-dark transition-colors"
        >
          {mostrarNueva ? "Cancelar" : "+ Agregar Dirección"}
        </button>
      </div>

      {mostrarNueva && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Dirección</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alias (Ej: Casa, Trabajo)</label>
              <input
                type="text"
                placeholder="Casa, Trabajo, etc."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                value={nuevaDireccionForm.alias}
                onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, alias: e.target.value })}
              />
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Calle"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                  value={nuevaDireccionForm.calle}
                  onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, calle: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Altura"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                  value={nuevaDireccionForm.altura}
                  onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, altura: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piso, Depto, etc.</label>
              <input
                type="text"
                placeholder="2B, Piso 3, etc. (Opcional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                value={nuevaDireccionForm.linea2}
                onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, linea2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input
                  type="text"
                  placeholder="Buenos Aires"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                  value={nuevaDireccionForm.ciudad}
                  onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, ciudad: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  placeholder="Buenos Aires"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                  value={nuevaDireccionForm.provincia}
                  onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, provincia: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  placeholder="1425"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                  value={nuevaDireccionForm.codigo_postal}
                  onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, codigo_postal: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={nuevaDireccionForm.es_principal}
                    onChange={e => setNuevaDireccionForm({ ...nuevaDireccionForm, es_principal: e.target.checked })}
                    className="w-4 h-4 text-green-main rounded border-gray-300 focus:ring-green-main"
                  />
                  <span className="text-sm font-medium text-gray-700">Marcar como principal</span>
                </label>
              </div>
            </div>

            <button
              disabled={crearDireccion.isPending || !nuevaDireccionForm.calle || !nuevaDireccionForm.altura || !nuevaDireccionForm.ciudad}
              onClick={() => {
                const ciudad = nuevaDireccionForm.ciudad.trim();
                if (!ciudad) return;

                const payload: DireccionCreate = {
                  alias: nuevaDireccionForm.alias,
                  linea1: `${nuevaDireccionForm.calle} ${nuevaDireccionForm.altura}`.trim(),
                  linea2: nuevaDireccionForm.linea2 || undefined,
                  ciudad,
                  provincia: nuevaDireccionForm.provincia || undefined,
                  codigo_postal: nuevaDireccionForm.codigo_postal || undefined,
                  es_principal: nuevaDireccionForm.es_principal,
                };
                crearDireccion.mutate(payload, {
                  onSuccess: () => {
                    setMostrarNueva(false);
                    setNuevaDireccionForm({ alias: "", calle: "", altura: "", linea2: "", ciudad: "", provincia: "", codigo_postal: "", es_principal: false });
                  }
                });
              }}
              className="w-full bg-gray-900 text-white font-semibold py-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {crearDireccion.isPending ? "Guardando..." : "Guardar Dirección"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Cargando direcciones...</p>
      ) : !direcciones || direcciones.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No tenés direcciones guardadas</h2>
          <p className="text-gray-500 mt-2">Agregá una para poder hacer tus pedidos con envío a domicilio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {direcciones.map((dir) => (
            <div key={dir.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
              {dir.es_principal && (
                <div className="absolute top-0 right-0 bg-green-100 text-green-dark text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Principal
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-gray-50 p-2 rounded-full text-green-main">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{dir.alias || "Dirección"}</h3>
                  <p className="text-gray-600 mt-1">{dir.linea1}</p>
                  {dir.linea2 && <p className="text-gray-500 text-sm">{dir.linea2}</p>}
                  <p className="text-gray-500 text-sm mt-0.5">
                    {dir.ciudad}{dir.provincia ? `, ${dir.provincia}` : ""}{dir.codigo_postal ? ` - CP ${dir.codigo_postal}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

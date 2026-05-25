/** Página de administración de usuarios — solo ADMIN. */
import { useState } from "react";
import { Search, Shield, RotateCcw, UserX } from "lucide-react";
import {
  useActualizarRolesUsuario,
  useEliminarUsuario,
  useRestaurarUsuario,
  useRoles,
  useUsuarios,
} from "../hooks/useUsuarios";
import type { UsuarioAdmin } from "../types";

type EstadoFiltro = "activo" | "inactivo" | "todos";

export default function UsuariosPage() {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 10,
    search: "",
    rol: "",
    estado: "activo" as EstadoFiltro,
  });

  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useUsuarios(filters);
  const { data: roles } = useRoles();

  const actualizarRoles = useActualizarRolesUsuario();
  const eliminarUsuario = useEliminarUsuario();
  const restaurarUsuario = useRestaurarUsuario();

  const handleSearch = () => {
    setFilters((f) => ({
      ...f,
      search: searchInput.trim(),
      page: 1,
    }));
  };

  const handleCambiarRol = async (usuario: UsuarioAdmin, rol: string) => {
    if (!rol) return;

    await actualizarRoles.mutateAsync({
      id: usuario.id,
      data: {
        roles: [rol],
      },
    });
  };

  const handleDesactivar = async (usuario: UsuarioAdmin) => {
    if (!confirm(`¿Desactivar el usuario ${usuario.email}?`)) return;
    await eliminarUsuario.mutateAsync(usuario.id);
  };

  const handleRestaurar = async (usuario: UsuarioAdmin) => {
    await restaurarUsuario.mutateAsync(usuario.id);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-dark">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administrá usuarios, estados y roles del sistema.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar por nombre, apellido o email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main outline-none"
            />
          </div>

          <select
            value={filters.rol}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                rol: e.target.value,
                page: 1,
              }))
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main outline-none bg-white"
          >
            <option value="">Todos los roles</option>
            {roles?.map((r) => (
              <option key={r.codigo} value={r.codigo}>
                {r.codigo}
              </option>
            ))}
          </select>

          <select
            value={filters.estado}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                estado: e.target.value as EstadoFiltro,
                page: 1,
              }))
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main outline-none bg-white"
          >
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-main border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 text-gray-500">
            No hay usuarios con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Celular
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {data.items.map((u) => {
                  const inactivo = !!u.deleted_at;
                  const userRoles = u.roles ?? [];
                  const rolPrincipal = userRoles[0] || "";

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        inactivo ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-gray-500">
                        #{u.id}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.nombre} {u.apellido}
                      </td>

                      <td className="px-4 py-3 text-gray-600">{u.email}</td>

                      <td className="px-4 py-3 text-gray-500">
                        {u.celular || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {userRoles.map((rol) => (
                            <span
                              key={rol}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-dark"
                            >
                              <Shield size={11} />
                              {rol}
                            </span>
                          ))}
                        </div>

                        {!inactivo && (
                          <select
                            value={rolPrincipal}
                            onChange={(e) => handleCambiarRol(u, e.target.value)}
                            disabled={actualizarRoles.isPending}
                            className="px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:ring-1 focus:ring-green-main outline-none"
                          >
                            <option value="">Asignar rol...</option>
                            {roles?.map((r) => (
                              <option key={r.codigo} value={r.codigo}>
                                {r.codigo}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {inactivo ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                            Inactivo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-dark">
                            Activo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {inactivo ? (
                          <button
                            onClick={() => handleRestaurar(u)}
                            disabled={restaurarUsuario.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-dark hover:bg-green-100 disabled:opacity-50"
                          >
                            <RotateCcw size={13} />
                            Restaurar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDesactivar(u)}
                            disabled={eliminarUsuario.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            <UserX size={13} />
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={filters.page === 1}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                page: f.page - 1,
              }))
            }
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            {data.page} / {data.pages}
          </span>

          <button
            disabled={filters.page === data.pages}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                page: f.page + 1,
              }))
            }
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
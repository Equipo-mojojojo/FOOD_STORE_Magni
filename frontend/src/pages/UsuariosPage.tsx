/** Página de administración de usuarios — solo ADMIN. */
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import type { UsuarioAdmin } from "../types";

function useUsuarios() {
  return useQuery<UsuarioAdmin[]>({
    queryKey: ["usuarios-admin"],
    queryFn: async () => {
      const res = await axiosClient.get<UsuarioAdmin[]>("/usuarios");
      return res.data;
    },
  });
}

export default function UsuariosPage() {
  const { data, isLoading } = useUsuarios();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-dark">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">Listado de usuarios registrados en el sistema.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-main border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.length ? (
          <div className="text-center py-16 text-gray-500">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Celular</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500">#{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.celular || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

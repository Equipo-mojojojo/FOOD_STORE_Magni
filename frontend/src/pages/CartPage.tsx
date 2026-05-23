/** Página carrito — wrapper fino sobre CarritoItems + resumen de pago. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import CarritoGrid from "../features/pedidos/CarritoGrid";
import { useCartStore } from "../store/cartStore";
import { useCrearPedido, useFormasPago } from "../hooks/usePedidos";
import { useAuthStore } from "../store/authStore";

const COSTO_ENVIO = 50;

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  const { data: formasPago } = useFormasPago();
  const crearPedido = useCrearPedido();

  const [formaPago, setFormaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  const handleConfirmar = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!formaPago) {
      setError("Seleccioná una forma de pago.");
      return;
    }
    setError("");

    crearPedido.mutate(
      {
        items: items.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          personalizacion: [],
        })),
        forma_pago_codigo: formaPago,
        notas: notas || undefined,
      },
      {
        onSuccess: () => {
          clearCart();
          navigate("/mis-pedidos");
        },
        onError: (err: any) => {
          setError(err.response?.data?.detail || "Error al crear el pedido.");
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShoppingBag size={64} className="text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-700">Tu carrito está vacío</h2>
        <p className="text-gray-500">Agregá productos desde la tienda.</p>
        <Link
          to="/"
          className="bg-green-main text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-dark transition-colors"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature component — lista de ítems con controles */}
          <div className="lg:col-span-2">
            <CarritoGrid />
          </div>

          {/* Resumen y pago */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen</h2>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${total.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de envío</span>
                  <span>${COSTO_ENVIO}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>${(total + COSTO_ENVIO).toLocaleString("es-AR")}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de pago
                </label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-main"
                >
                  <option value="">Seleccioná...</option>
                  {formasPago
                    ?.filter((f) => f.habilitado)
                    .map((f) => (
                      <option key={f.codigo} value={f.codigo}>
                        {f.descripcion}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones especiales..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-main"
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <button
                onClick={handleConfirmar}
                disabled={crearPedido.isPending}
                className="w-full bg-green-main hover:bg-green-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {crearPedido.isPending
                  ? "Procesando..."
                  : isAuthenticated
                  ? "Confirmar pedido"
                  : "Ingresá para pedir"}
              </button>

              <Link
                to="/"
                className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
              >
                ← Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

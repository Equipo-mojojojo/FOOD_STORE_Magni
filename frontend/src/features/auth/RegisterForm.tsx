/** Formulario de registro. */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim() || !formData.password.trim()) {
      return "Todos los campos obligatorios deben estar completos.";
    }
    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "El formato de email no es válido.";
    }
    // Validaciones de contraseña
    const pass = formData.password;
    if (pass.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[A-Z]/.test(pass)) return "La contraseña debe tener al menos una letra mayúscula.";
    if (!/[a-z]/.test(pass)) return "La contraseña debe tener al menos una letra minúscula.";
    if (!/[0-9]/.test(pass)) return "La contraseña debe tener al menos un número.";
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Validar antes de enviar al backend
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // 2. Pegarle a la API
      await authApi.register(formData);
      // 3. Redirigir al login (podemos pasar estado si queremos mostrar un cartel de éxito ahí)
      navigate("/login", { state: { successMessage: "¡Registro exitoso! Por favor, iniciá sesión." } });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        const detail = axiosErr.response?.data?.detail;
        setError(detail || `Error del servidor (${axiosErr.response?.status})`);
      } else if (err instanceof Error) {
        setError(`Error de red: ${err.message}`);
      } else {
        setError("Error desconocido al intentar registrarse");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-dark via-green-main to-green-light p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-main rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-green-dark">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Completá tus datos para sumarte</p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-danger-light text-danger-dark px-4 py-3 rounded-lg text-sm mb-4 border border-danger/20">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Juan"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Pérez"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@ejemplo.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="tel"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              placeholder="+54 11 1234-5678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-main focus:border-transparent outline-none transition-all text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-main hover:bg-green-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg active:scale-[0.98] mt-4"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        {/* Link para volver al login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-green-main hover:text-green-dark font-medium transition-colors">
            Iniciá sesión acá
          </Link>
        </p>
      </div>
    </div>
  );
}

# 🍔 Food Store — Guía de Ejecución

Para levantar la aplicación correctamente, necesitas abrir **tres terminales separadas** y seguir estos pasos en orden.

---

## 1. 🗄️ Base de Datos (PostgreSQL en Docker)

Asegurate de tener Docker Desktop abierto en tu computadora. En la primera terminal, posicionado en la raíz del proyecto, ejecutá:

```powershell
# Levanta la base de datos en segundo plano
docker compose up -d
```
*(Para apagarla cuando termines: `docker compose down`)*

---

## 2. ⚙️ Backend (FastAPI)

En una **nueva** terminal, posicionado en la raíz del proyecto, ingresá a la carpeta del backend y activá el entorno virtual:

```powershell
cd backend

# 1. Crear el entorno virtual (SOLO LA PRIMERA VEZ o si borraste la carpeta .venv)
python -m venv .venv

# 2. Activar el entorno virtual (SIEMPRE ANTES DE CORRER EL PROYECTO)
.\.venv\Scripts\activate

# 3. Instalar dependencias (SOLO SI HAY CAMBIOS en requirements.txt)
pip install -r requirements.txt

# 4. Levantar el servidor
uvicorn app.main:app --reload --port 8000
```
*El backend estará corriendo en `http://localhost:8000` y podés ver la documentación en `http://localhost:8000/docs`.*

---

## 3. 🎨 Frontend (React + Vite)

En una **tercera** terminal, posicionado en la raíz del proyecto, ingresá a la carpeta del frontend:

```powershell
cd frontend

# 1. Instalar dependencias (SOLO LA PRIMERA VEZ o si agregás nuevos paquetes)
npm install

# 2. Levantar la interfaz web
npm run dev
```
*El frontend estará corriendo en `http://localhost:5173`. Hacé Ctrl+Click en la terminal para abrirlo en tu navegador.*



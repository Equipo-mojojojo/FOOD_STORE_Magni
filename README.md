BACK
# 1. Posicionate en la carpeta del backend
cd "d:\Clara\Documents\UTN\4to Cuatri\Prog4_Magni\FOOD STORE\backend"
# 2. (Opcional) Si en el futuro necesitas instalar las dependencias de nuevo:
# pip install -r requirements.txt
# 3. Levantá el servidor
uvicorn app.main:app --reload --port 8000




FRONT
# 1. Posicionate en la carpeta del frontend
cd "d:\Clara\Documents\UTN\4to Cuatri\Prog4_Magni\FOOD STORE\frontend"

# 2. (Opcional) Si en el futuro necesitas instalar dependencias:
# npm install

# 3. Levantá la interfaz web
npm run dev


BASE DE DATOS (PostgreSQL - Docker)
# 1. Posicionate en la raiz del proyecto el que corresponda a cada uno
cd "d:\Clara\Documents\UTN\4to Cuatri\Prog4_Magni\FOOD STORE"

# 2. Levanta Docker (Recordar abrir antes tu Docker)
docker compose up -d


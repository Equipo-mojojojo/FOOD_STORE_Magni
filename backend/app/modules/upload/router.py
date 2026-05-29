"""Router para subida de archivos estáticos (imágenes)."""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.core.deps import require_role

router = APIRouter(prefix="/api/v1/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/imagen", response_model=dict, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["ADMIN"]))])
async def upload_imagen(file: UploadFile = File(...)):
    """Sube una imagen y retorna su URL estática."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    # Generar nombre único
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar la imagen: {str(e)}")
        
    return {"url": f"/static/uploads/{unique_filename}"}

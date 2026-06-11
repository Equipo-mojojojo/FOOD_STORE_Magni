"""Router para subida de archivos estáticos (imágenes)."""
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.core.deps import require_role
from app.core.media import STATIC_UPLOADS_URL, UPLOAD_DIR

router = APIRouter(prefix="/api/v1/upload", tags=["Uploads"])

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post(
    "/imagen",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["ADMIN", "COCINA_STOCK"]))],
)
async def upload_imagen(file: UploadFile = File(...)):
    """Sube una imagen y retorna su URL estática."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    # Generar nombre único
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Guardar archivo
    try:
        with file_path.open("wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar la imagen: {str(e)}")
        
    return {"url": f"{STATIC_UPLOADS_URL}/{unique_filename}"}

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Request, UploadFile

from .. import models
from ..config import settings
from ..schemas.upload import UploadResponse
from .deps import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_file(
    request: Request,
    file: UploadFile,
    current_user: models.Utilisateur = Depends(get_current_user),
):
    suffix = Path(file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / stored_name

    contents = await file.read()
    destination.write_bytes(contents)

    # Absolute URL so the file resolves against the API host (not the frontend origin).
    base = str(request.base_url).rstrip("/")
    return UploadResponse(fileName=file.filename, url=f"{base}/uploads/{stored_name}")

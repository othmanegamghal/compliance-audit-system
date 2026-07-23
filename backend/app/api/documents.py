from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.document import DocumentCreate, DocumentOut
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/documents", tags=["documents"])


def document_to_out(d: models.DocumentReference) -> DocumentOut:
    return DocumentOut(
        id=str(d.id_document),
        projectId=str(d.id_projet),
        name=d.nom,
        version=d.version,
        type=d.type,
        path=d.chemin,
    )


@router.get("", response_model=list[DocumentOut])
def list_documents(
    projectId: int | None = None,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(get_current_user),
):
    query = db.query(models.DocumentReference)
    if projectId is not None:
        query = query.filter(models.DocumentReference.id_projet == projectId)
    docs = query.order_by(models.DocumentReference.id_document.desc()).all()
    return [document_to_out(d) for d in docs]


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction", "auditor")),
):
    if db.get(models.Projet, int(payload.projectId)) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Projet inconnu")
    doc = models.DocumentReference(
        id_projet=int(payload.projectId),
        nom=payload.name,
        version=payload.version,
        type=payload.type,
        chemin=payload.path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return document_to_out(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction", "auditor")),
):
    doc = db.get(models.DocumentReference, document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    db.delete(doc)
    db.commit()

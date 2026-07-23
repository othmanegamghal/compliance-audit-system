from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.misc import CommentCreate, CommentOut
from ..serializers import iso
from .deps import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])


def comment_to_out(c: models.Commentaire, db: Session) -> CommentOut:
    user = db.get(models.Utilisateur, c.id_utilisateur)
    name = "Utilisateur"
    avatar = None
    if user:
        name = f"{user.prenom} {user.nom}".strip() if user.prenom else user.nom
        avatar = user.photo
    return CommentOut(
        id=str(c.id_commentaire),
        userId=str(c.id_utilisateur),
        userName=name,
        userAvatar=avatar,
        auditId=str(c.id_audit) if c.id_audit else None,
        findingId=str(c.id_non_conformite) if c.id_non_conformite else None,
        content=c.contenu,
        date=iso(c.date_commentaire) or "",
    )


@router.get("", response_model=list[CommentOut])
def list_comments(
    auditId: int | None = Query(None),
    findingId: int | None = Query(None),
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(get_current_user),
):
    query = db.query(models.Commentaire)
    if auditId is not None:
        query = query.filter(models.Commentaire.id_audit == auditId)
    if findingId is not None:
        query = query.filter(models.Commentaire.id_non_conformite == findingId)
    comments = query.order_by(models.Commentaire.id_commentaire.asc()).all()
    return [comment_to_out(c, db) for c in comments]


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(get_current_user),
):
    if not payload.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Commentaire vide")
    comment = models.Commentaire(
        id_utilisateur=current_user.id_utilisateur,
        id_audit=int(payload.auditId) if payload.auditId else None,
        id_non_conformite=int(payload.findingId) if payload.findingId else None,
        contenu=payload.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment_to_out(comment, db)

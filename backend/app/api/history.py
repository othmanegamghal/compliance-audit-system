from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.misc import HistoryOut
from ..serializers import iso
from .deps import require_roles

router = APIRouter(prefix="/history", tags=["history"])


def history_to_out(h: models.Historique, db: Session) -> HistoryOut:
    user = db.get(models.Utilisateur, h.id_utilisateur)
    name = "Utilisateur"
    if user:
        name = f"{user.prenom} {user.nom}".strip() if user.prenom else user.nom
    return HistoryOut(
        id=str(h.id_historique),
        userId=str(h.id_utilisateur),
        userName=name,
        action=h.action,
        description=h.description,
        date=iso(h.date_action) or "",
        ip=h.adresse_ip,
        auditId=str(h.id_audit) if h.id_audit else None,
    )


@router.get("", response_model=list[HistoryOut])
def list_history(
    limit: int = 200,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    entries = (
        db.query(models.Historique)
        .order_by(models.Historique.id_historique.desc())
        .limit(min(limit, 500))
        .all()
    )
    return [history_to_out(h, db) for h in entries]

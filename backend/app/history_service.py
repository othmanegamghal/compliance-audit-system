from sqlalchemy.orm import Session

from . import models


def log(
    db: Session,
    user_id: int,
    action: str,
    description: str | None = None,
    audit_id: int | None = None,
    ip: str | None = None,
) -> None:
    """Record an action in the traceability history. Caller commits."""
    entry = models.Historique(
        id_utilisateur=user_id,
        id_audit=audit_id,
        action=action,
        description=description,
        adresse_ip=ip,
    )
    db.add(entry)

"""Row-level scoping helpers.

A manager (responsable) may only see and act on data related to their own
department. These helpers return None for roles with no restriction, or a set
of allowed ids for a manager.
"""
from sqlalchemy.orm import Session

from . import models


def is_manager(user: models.Utilisateur) -> bool:
    return user.role is not None and user.role.nom == "manager"


def scoped_audit_ids(db: Session, user: models.Utilisateur) -> set[int] | None:
    """Audit ids the user may see, or None when unrestricted."""
    if not is_manager(user):
        return None
    rows = db.query(models.Audit.id_audit).filter(
        models.Audit.id_departement == user.id_departement
    ).all()
    return {r[0] for r in rows}


def scoped_finding_ids(db: Session, user: models.Utilisateur) -> set[int] | None:
    """Non-conformity ids the user may see, or None when unrestricted."""
    if not is_manager(user):
        return None
    audit_ids = scoped_audit_ids(db, user) or set()
    query = db.query(models.NonConformite.id_non_conformite).filter(
        (models.NonConformite.id_audit.in_(audit_ids))
        | (models.NonConformite.id_utilisateur_assigne == user.id_utilisateur)
    )
    return {r[0] for r in query.all()}


def manager_can_touch_finding(db: Session, user: models.Utilisateur, finding_id: int) -> bool:
    if not is_manager(user):
        return True
    allowed = scoped_finding_ids(db, user) or set()
    return finding_id in allowed

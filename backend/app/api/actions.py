from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..notifications_service import notify
from ..schemas.action import ActionCreate, ActionOut, ActionUpdate
from ..scoping import is_manager, manager_can_touch_finding, scoped_finding_ids
from ..serializers import action_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("", response_model=list[ActionOut])
def list_actions(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    query = db.query(models.ActionCorrective).order_by(models.ActionCorrective.id_action.desc())
    if is_manager(current_user):
        allowed_findings = scoped_finding_ids(db, current_user) or set()
        query = query.filter(
            (models.ActionCorrective.id_non_conformite.in_(allowed_findings))
            | (models.ActionCorrective.id_utilisateur == current_user.id_utilisateur)
        )
    return [action_to_out(a) for a in query.all()]


@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(
    payload: ActionCreate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor", "manager")),
):
    finding = db.get(models.NonConformite, int(payload.nonConformityId))
    if finding is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Non-conformité inconnue")
    if not manager_can_touch_finding(db, current_user, finding.id_non_conformite):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non-conformité hors de votre département")

    action = models.ActionCorrective(
        id_non_conformite=finding.id_non_conformite,
        id_utilisateur=int(payload.assignee),
        description=payload.text,
        date_limite=date.fromisoformat(payload.dueDate) if payload.dueDate else None,
        statut=payload.status or "todo",
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    notify(
        db,
        action.id_utilisateur,
        "Action Assigned",
        "New corrective action successfully created.",
        "success",
    )
    db.commit()

    return action_to_out(action)


@router.patch("/{action_id}", response_model=ActionOut)
def update_action(
    action_id: int,
    payload: ActionUpdate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor", "manager")),
):
    action = db.get(models.ActionCorrective, action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action introuvable")
    if is_manager(current_user) and not manager_can_touch_finding(db, current_user, action.id_non_conformite) and action.id_utilisateur != current_user.id_utilisateur:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action hors de votre département")

    action.statut = payload.status
    if payload.status == "completed":
        action.date_realisation = date.today()

    db.commit()

    if payload.status == "completed":
        sibling_actions = (
            db.query(models.ActionCorrective)
            .filter(models.ActionCorrective.id_non_conformite == action.id_non_conformite)
            .all()
        )
        all_completed = all(a.statut == "completed" for a in sibling_actions)
        if all_completed:
            finding = db.get(models.NonConformite, action.id_non_conformite)
            finding.statut = "action_completed"
            db.commit()

            if finding.id_audit:
                audit = db.get(models.Audit, finding.id_audit)
                if audit:
                    notify(
                        db,
                        audit.id_utilisateur,
                        "Action Completed",
                        "All corrective actions for this finding are complete. Auditor validation is pending.",
                        "success",
                        audit_id=audit.id_audit,
                    )
                    db.commit()

    db.refresh(action)
    return action_to_out(action)

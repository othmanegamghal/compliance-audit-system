from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..notifications_service import notify
from ..ai_service import AINotConfiguredError, suggest_corrective_action
from ..schemas.ai import SuggestActionOut
from ..schemas.finding import FindingOut, FindingUpdate
from ..scoping import manager_can_touch_finding, scoped_finding_ids
from ..serializers import finding_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/findings", tags=["findings"])


@router.post("/{finding_id}/suggest-action", response_model=SuggestActionOut)
def suggest_action(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor", "manager")),
):
    finding = db.get(models.NonConformite, finding_id)
    if finding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-conformité introuvable")
    if not manager_can_touch_finding(db, current_user, finding_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non-conformité hors de votre département")

    description = finding.description or finding.titre or "Non-conformité"
    try:
        result = suggest_corrective_action(description, finding.gravite)
    except AINotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Suggestion IA échouée : {exc}")

    due = (date.today() + timedelta(days=result["dueInDays"])).isoformat()
    return SuggestActionOut(action=result["action"], dueDate=due)


@router.get("", response_model=list[FindingOut])
def list_findings(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    query = db.query(models.NonConformite).order_by(models.NonConformite.id_non_conformite.desc())
    allowed = scoped_finding_ids(db, current_user)
    if allowed is not None:
        query = query.filter(models.NonConformite.id_non_conformite.in_(allowed))
    return [finding_to_out(f, db) for f in query.all()]


@router.patch("/{finding_id}", response_model=FindingOut)
def update_finding(
    finding_id: int,
    payload: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor", "manager")),
):
    finding = db.get(models.NonConformite, finding_id)
    if finding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-conformité introuvable")
    if not manager_can_touch_finding(db, current_user, finding_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non-conformité hors de votre département")

    finding.statut = payload.status
    if payload.status == "resolved":
        finding.date_resolution = datetime.now()

    if payload.status == "action_pending" and payload.correctiveActionText:
        existing_action = (
            db.query(models.ActionCorrective)
            .filter(models.ActionCorrective.id_non_conformite == finding_id)
            .first()
        )
        if existing_action is None:
            due_date = date.today() + timedelta(days=7)
            if payload.correctiveActionDueDate:
                due_date = date.fromisoformat(payload.correctiveActionDueDate)
            action = models.ActionCorrective(
                id_non_conformite=finding_id,
                id_utilisateur=finding.id_utilisateur_assigne,
                description=payload.correctiveActionText,
                date_limite=due_date,
                statut="todo",
            )
            db.add(action)
            notify(
                db,
                finding.id_utilisateur_assigne,
                "Corrective Action Assigned",
                f"A new corrective action was assigned to you: {payload.correctiveActionText}",
                "info",
            )

    db.commit()
    db.refresh(finding)
    return finding_to_out(finding, db)

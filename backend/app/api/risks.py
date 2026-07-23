from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.risk import (
    MitigationCreate,
    MitigationOut,
    RiskCreate,
    RiskOut,
    RiskUpdate,
)
from ..scoping import scoped_finding_ids
from ..serializers import iso, risk_level
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/risks", tags=["risks"])


def risk_to_out(r: models.Risque) -> RiskOut:
    criticality = (r.criticite if r.criticite is not None else (r.impact or 1) * (r.probabilite or 1))
    return RiskOut(
        id=str(r.id_risque),
        nonConformityId=str(r.id_non_conformite),
        name=r.nom,
        description=r.description,
        impact=r.impact or 1,
        probability=r.probabilite or 1,
        criticality=criticality,
        level=risk_level(criticality),
        status=r.statut,
    )


def mitigation_to_out(m: models.PlanMitigation) -> MitigationOut:
    return MitigationOut(
        id=str(m.id_plan),
        riskId=str(m.id_risque),
        description=m.description,
        dueDate=iso(m.date_limite),
        status=m.statut,
    )


@router.get("", response_model=list[RiskOut])
def list_risks(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    query = db.query(models.Risque).order_by(models.Risque.id_risque.desc())
    allowed = scoped_finding_ids(db, current_user)
    if allowed is not None:
        query = query.filter(models.Risque.id_non_conformite.in_(allowed))
    return [risk_to_out(r) for r in query.all()]


@router.post("", response_model=RiskOut, status_code=status.HTTP_201_CREATED)
def create_risk(
    payload: RiskCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("direction", "manager", "auditor")),
):
    if db.get(models.NonConformite, int(payload.nonConformityId)) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Non-conformité inconnue")
    impact = max(1, min(5, payload.impact))
    probability = max(1, min(5, payload.probability))
    risk = models.Risque(
        id_non_conformite=int(payload.nonConformityId),
        nom=payload.name,
        description=payload.description,
        impact=impact,
        probabilite=probability,
        criticite=impact * probability,
        statut=payload.status or "open",
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk_to_out(risk)


@router.patch("/{risk_id}", response_model=RiskOut)
def update_risk(
    risk_id: int,
    payload: RiskUpdate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("direction", "manager", "auditor")),
):
    risk = db.get(models.Risque, risk_id)
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risque introuvable")
    if payload.name is not None:
        risk.nom = payload.name
    if payload.description is not None:
        risk.description = payload.description
    if payload.impact is not None:
        risk.impact = max(1, min(5, payload.impact))
    if payload.probability is not None:
        risk.probabilite = max(1, min(5, payload.probability))
    if payload.status is not None:
        risk.statut = payload.status
    risk.criticite = (risk.impact or 1) * (risk.probabilite or 1)
    db.commit()
    db.refresh(risk)
    return risk_to_out(risk)


@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("direction", "manager")),
):
    risk = db.get(models.Risque, risk_id)
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risque introuvable")
    db.query(models.PlanMitigation).filter(models.PlanMitigation.id_risque == risk_id).delete()
    db.delete(risk)
    db.commit()


# ---- Mitigation plans ----

@router.get("/{risk_id}/mitigations", response_model=list[MitigationOut])
def list_mitigations(risk_id: int, db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    plans = db.query(models.PlanMitigation).filter(models.PlanMitigation.id_risque == risk_id).all()
    return [mitigation_to_out(m) for m in plans]


@router.post("/{risk_id}/mitigations", response_model=MitigationOut, status_code=status.HTTP_201_CREATED)
def create_mitigation(
    risk_id: int,
    payload: MitigationCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("direction", "manager", "auditor")),
):
    if db.get(models.Risque, risk_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Risque inconnu")
    plan = models.PlanMitigation(
        id_risque=risk_id,
        description=payload.description,
        date_limite=date.fromisoformat(payload.dueDate) if payload.dueDate else None,
        statut=payload.status or "todo",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return mitigation_to_out(plan)


@router.patch("/mitigations/{plan_id}", response_model=MitigationOut)
def update_mitigation_status(
    plan_id: int,
    status_value: str,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("direction", "manager", "auditor")),
):
    plan = db.get(models.PlanMitigation, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan introuvable")
    plan.statut = status_value
    db.commit()
    db.refresh(plan)
    return mitigation_to_out(plan)

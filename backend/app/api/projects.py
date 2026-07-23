from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..history_service import log
from ..schemas.project import (
    ObjectiveCreate,
    ObjectiveOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
)
from ..serializers import iso
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/projects", tags=["projects"])


def _parse_date(value: str | None):
    return date.fromisoformat(value) if value else None


def project_to_out(p: models.Projet, db: Session) -> ProjectOut:
    objectives_count = db.query(models.Objectif).filter(models.Objectif.id_projet == p.id_projet).count()
    return ProjectOut(
        id=str(p.id_projet),
        departmentId=str(p.id_departement),
        name=p.nom,
        description=p.description,
        startDate=iso(p.date_debut),
        budget=float(p.budget) if p.budget is not None else None,
        priority=p.priorite,
        status=p.statut,
        objectivesCount=objectives_count,
    )


def objective_to_out(o: models.Objectif) -> ObjectiveOut:
    return ObjectiveOut(
        id=str(o.id_objectif),
        projectId=str(o.id_projet),
        departmentId=str(o.id_departement),
        name=o.nom,
        description=o.description,
        targetValue=float(o.valeur_cible) if o.valeur_cible is not None else None,
        startDate=iso(o.date_debut),
        endDate=iso(o.date_fin),
        status=o.statut,
    )


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    projects = db.query(models.Projet).order_by(models.Projet.id_projet.desc()).all()
    return [project_to_out(p, db) for p in projects]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    if db.get(models.Departement, int(payload.departmentId)) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inconnu")
    project = models.Projet(
        id_departement=int(payload.departmentId),
        nom=payload.name,
        description=payload.description,
        date_debut=_parse_date(payload.startDate),
        budget=payload.budget,
        priorite=payload.priority,
        statut=payload.status or "active",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    log(db, current_user.id_utilisateur, "create_project", f'Projet "{project.nom}" créé.')
    db.commit()
    return project_to_out(project, db)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    project = db.get(models.Projet, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable")
    if payload.name is not None:
        project.nom = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.startDate is not None:
        project.date_debut = _parse_date(payload.startDate)
    if payload.budget is not None:
        project.budget = payload.budget
    if payload.priority is not None:
        project.priorite = payload.priority
    if payload.status is not None:
        project.statut = payload.status
    db.commit()
    db.refresh(project)
    return project_to_out(project, db)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    project = db.get(models.Projet, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable")
    db.query(models.Objectif).filter(models.Objectif.id_projet == project_id).delete()
    db.delete(project)
    db.commit()


# ---- Objectives ----

@router.get("/{project_id}/objectives", response_model=list[ObjectiveOut])
def list_objectives(project_id: int, db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    objectives = db.query(models.Objectif).filter(models.Objectif.id_projet == project_id).all()
    return [objective_to_out(o) for o in objectives]


@router.post("/{project_id}/objectives", response_model=ObjectiveOut, status_code=status.HTTP_201_CREATED)
def create_objective(
    project_id: int,
    payload: ObjectiveCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction", "manager")),
):
    project = db.get(models.Projet, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Projet inconnu")
    objective = models.Objectif(
        id_projet=project_id,
        id_departement=project.id_departement,
        nom=payload.name,
        description=payload.description,
        valeur_cible=payload.targetValue,
        date_debut=_parse_date(payload.startDate),
        date_fin=_parse_date(payload.endDate),
        statut=payload.status or "in_progress",
    )
    db.add(objective)
    db.commit()
    db.refresh(objective)
    return objective_to_out(objective)


@router.delete("/objectives/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_objective(
    objective_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction", "manager")),
):
    objective = db.get(models.Objectif, objective_id)
    if objective is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objectif introuvable")
    db.delete(objective)
    db.commit()

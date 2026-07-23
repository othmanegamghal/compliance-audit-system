from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..notifications_service import notify
from ..schemas.audit import AnswersSubmit, AuditCreate, AuditOut
from ..scoping import scoped_audit_ids
from ..serializers import VALUE_TO_CONFORMITE, audit_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/audits", tags=["audits"])


@router.get("", response_model=list[AuditOut])
def list_audits(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    query = db.query(models.Audit).order_by(models.Audit.id_audit.desc())
    allowed = scoped_audit_ids(db, current_user)
    if allowed is not None:
        query = query.filter(models.Audit.id_audit.in_(allowed))
    return [audit_to_out(a, db) for a in query.all()]


@router.get("/{audit_id}", response_model=AuditOut)
def get_audit(audit_id: int, db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    audit = db.get(models.Audit, audit_id)
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit introuvable")
    allowed = scoped_audit_ids(db, current_user)
    if allowed is not None and audit_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Audit hors de votre département")
    return audit_to_out(audit, db)


@router.post("", response_model=AuditOut, status_code=status.HTTP_201_CREATED)
def create_audit(
    payload: AuditCreate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor")),
):
    department = db.get(models.Departement, int(payload.departmentId))
    if department is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inconnu")
    template = db.get(models.ModeleChecklist, int(payload.templateId))
    if template is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modèle de checklist inconnu")
    auditor = db.get(models.Utilisateur, int(payload.auditorId))
    if auditor is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auditeur inconnu")

    audit = models.Audit(
        id_departement=department.id_departement,
        id_utilisateur=auditor.id_utilisateur,
        id_modele=template.id_modele,
        titre=payload.name,
        statut=payload.status or "draft",
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)

    notify(
        db,
        auditor.id_utilisateur,
        "Audit Created",
        f'New audit "{audit.titre}" initialized.',
        "info",
        audit_id=audit.id_audit,
    )
    db.commit()

    return audit_to_out(audit, db)


def _get_or_create_default_category(db: Session) -> models.CategorieNonConformite:
    category = db.query(models.CategorieNonConformite).first()
    if category is None:
        category = models.CategorieNonConformite(nom="Générale", description="Catégorie par défaut")
        db.add(category)
        db.flush()
    return category


def _department_manager_id(db: Session, department_id: int) -> int | None:
    manager = (
        db.query(models.Utilisateur)
        .join(models.Role)
        .filter(models.Utilisateur.id_departement == department_id, models.Role.nom == "manager")
        .first()
    )
    return manager.id_utilisateur if manager else None


@router.put("/{audit_id}/answers", response_model=AuditOut)
def save_answers(
    audit_id: int,
    payload: AnswersSubmit,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor")),
):
    audit = db.get(models.Audit, audit_id)
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit introuvable")

    for ans in payload.answers:
        question_id = int(ans.questionId)
        reponse = (
            db.query(models.ReponseAudit)
            .filter(models.ReponseAudit.id_audit == audit_id, models.ReponseAudit.id_question == question_id)
            .first()
        )
        conformite = VALUE_TO_CONFORMITE.get(ans.value) if ans.value else None
        if reponse is None:
            reponse = models.ReponseAudit(
                id_audit=audit_id,
                id_question=question_id,
                id_utilisateur=current_user.id_utilisateur,
            )
            db.add(reponse)
        reponse.reponse = ans.value
        reponse.conformite = conformite
        reponse.commentaire = ans.comment
        reponse.preuve_nom = ans.evidenceFileName
        reponse.preuve_chemin = ans.evidenceUrl
        reponse.date_reponse = datetime.now()

    if payload.isFinalSubmit:
        audit.statut = "closed"
        audit.date_fin = date.today()
    else:
        audit.statut = "in_progress"

    db.commit()

    if payload.isFinalSubmit:
        manager_id = _department_manager_id(db, audit.id_departement)
        findings_raised = 0

        for ans in payload.answers:
            if ans.value in ("no", "partial"):
                question = db.get(models.QuestionChecklist, int(ans.questionId))
                category = _get_or_create_default_category(db)
                finding = models.NonConformite(
                    id_categorie=category.id_categorie,
                    id_audit=audit.id_audit,
                    id_question=int(ans.questionId),
                    titre=question.libelle if question else None,
                    description=(
                        f'Audit checklist non-compliance: "{question.libelle if question else ""}". '
                        f'Auditor comment: {ans.comment or "None provided"}'
                    ),
                    gravite="high" if ans.value == "no" else "medium",
                    statut="open",
                    id_utilisateur_assigne=manager_id,
                )
                db.add(finding)
                findings_raised += 1

        db.commit()

        if findings_raised > 0:
            notify(
                db,
                manager_id,
                "Findings Raised",
                f'{findings_raised} Non-Conformities were automatically raised for audit "{audit.titre}".',
                "warning",
                audit_id=audit.id_audit,
            )
        else:
            notify(
                db,
                audit.id_utilisateur,
                "Audit Completed",
                f'Audit "{audit.titre}" completed with 100% compliance. Great work!',
                "success",
                audit_id=audit.id_audit,
            )
        db.commit()

    db.refresh(audit)
    return audit_to_out(audit, db)

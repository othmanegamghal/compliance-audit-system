from datetime import date, datetime

from sqlalchemy.orm import Session

from . import models
from .schemas.action import ActionOut
from .schemas.audit import AuditAnswerOut, AuditOut
from .schemas.department import DepartmentOut
from .schemas.finding import FindingOut
from .schemas.notification import NotificationOut
from .schemas.template import QuestionOut, TemplateOut
from .schemas.user import UserOut


def iso(value: datetime | date | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def compute_score(answer_values: list[str | None]) -> int:
    evaluated = [v for v in answer_values if v is not None]
    if not evaluated:
        return 100
    yes_count = evaluated.count("yes")
    partial_count = evaluated.count("partial")
    return round(((yes_count * 1.0 + partial_count * 0.5) / len(evaluated)) * 100)


def user_to_out(u: models.Utilisateur) -> UserOut:
    full_name = f"{u.prenom} {u.nom}".strip() if u.prenom else u.nom
    return UserOut(
        id=str(u.id_utilisateur),
        name=full_name,
        email=u.email,
        role=u.role.nom,
        departmentId=str(u.id_departement) if u.id_departement else None,
        avatar=u.photo,
        status="active" if u.actif else "inactive",
        language=u.langue or "en",
        timezone=u.timezone or "utc+0",
    )


def department_to_out(d: models.Departement, db: Session) -> DepartmentOut:
    manager = (
        db.query(models.Utilisateur)
        .join(models.Role)
        .filter(models.Utilisateur.id_departement == d.id_departement, models.Role.nom == "manager")
        .first()
    )
    closed_audits = (
        db.query(models.Audit)
        .filter(models.Audit.id_departement == d.id_departement, models.Audit.statut == "closed")
        .all()
    )
    if closed_audits:
        scores = [audit_score(a, db) for a in closed_audits]
        compliance_rate = round(sum(scores) / len(scores))
    else:
        compliance_rate = 100

    return DepartmentOut(
        id=str(d.id_departement),
        name=d.nom,
        code=d.code,
        managerId=str(manager.id_utilisateur) if manager else None,
        complianceRate=compliance_rate,
    )


def question_to_out(q: models.QuestionChecklist) -> QuestionOut:
    return QuestionOut(id=str(q.id_question), text=q.libelle, category=q.categorie)


def template_to_out(t: models.ModeleChecklist) -> TemplateOut:
    return TemplateOut(
        id=str(t.id_modele),
        name=t.nom,
        description=t.description,
        questions=[question_to_out(q) for q in t.questions],
        createdAt=iso(t.date_creation) or "",
        createdBy=str(t.id_utilisateur_creation) if t.id_utilisateur_creation else None,
    )


VALUE_TO_CONFORMITE = {"yes": "conforme", "no": "non_conforme", "partial": "partiel"}
CONFORMITE_TO_VALUE = {v: k for k, v in VALUE_TO_CONFORMITE.items()}


def reponse_to_answer_out(r: models.ReponseAudit) -> AuditAnswerOut:
    return AuditAnswerOut(
        questionId=str(r.id_question),
        value=CONFORMITE_TO_VALUE.get(r.conformite),
        comment=r.commentaire,
        evidenceFileName=r.preuve_nom,
        evidenceUrl=r.preuve_chemin,
    )


def audit_score(a: models.Audit, db: Session) -> int:
    reponses = db.query(models.ReponseAudit).filter(models.ReponseAudit.id_audit == a.id_audit).all()
    values = [CONFORMITE_TO_VALUE.get(r.conformite) for r in reponses]
    return compute_score(values)


def audit_to_out(a: models.Audit, db: Session) -> AuditOut:
    reponses = db.query(models.ReponseAudit).filter(models.ReponseAudit.id_audit == a.id_audit).all()
    answers = [reponse_to_answer_out(r) for r in reponses]
    values = [ans.value for ans in answers]
    return AuditOut(
        id=str(a.id_audit),
        name=a.titre or "",
        departmentId=str(a.id_departement),
        templateId=str(a.id_modele) if a.id_modele else None,
        auditorId=str(a.id_utilisateur),
        status=a.statut or "draft",
        createdAt=iso(a.date_creation) or "",
        completedAt=iso(a.date_fin),
        answers=answers,
        score=compute_score(values),
    )


def finding_to_out(nc: models.NonConformite, db: Session) -> FindingOut:
    latest_action = (
        db.query(models.ActionCorrective)
        .filter(models.ActionCorrective.id_non_conformite == nc.id_non_conformite)
        .order_by(models.ActionCorrective.id_action.desc())
        .first()
    )
    preuve = (
        db.query(models.Preuve)
        .filter(models.Preuve.id_non_conformite == nc.id_non_conformite)
        .order_by(models.Preuve.id_preuve.desc())
        .first()
    )
    return FindingOut(
        id=str(nc.id_non_conformite),
        auditId=str(nc.id_audit) if nc.id_audit else None,
        questionId=str(nc.id_question) if nc.id_question else None,
        description=nc.description or "",
        severity=nc.gravite or "medium",
        status=nc.statut or "open",
        assignedTo=str(nc.id_utilisateur_assigne) if nc.id_utilisateur_assigne else None,
        correctiveActionText=latest_action.description if latest_action else None,
        correctiveActionDueDate=iso(latest_action.date_limite) if latest_action else None,
        createdAt=iso(nc.date_creation) or "",
        resolvedAt=iso(nc.date_resolution),
        evidenceUrl=preuve.chemin_fichier if preuve else None,
    )


def action_to_out(ac: models.ActionCorrective) -> ActionOut:
    return ActionOut(
        id=str(ac.id_action),
        nonConformityId=str(ac.id_non_conformite),
        text=ac.description or "",
        status=ac.statut or "todo",
        assignee=str(ac.id_utilisateur),
        dueDate=iso(ac.date_limite),
        completedAt=iso(ac.date_realisation),
    )


def risk_level(criticality: int) -> str:
    if criticality >= 15:
        return "critical"
    if criticality >= 9:
        return "high"
    if criticality >= 4:
        return "medium"
    return "low"


def notification_to_out(n: models.Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id_notification),
        title=n.titre or "",
        message=n.message or "",
        date=iso(n.date_envoi) or "",
        read=bool(n.lue),
        type=n.type or "info",
    )

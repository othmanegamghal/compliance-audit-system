from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..ai_service import AINotConfiguredError, answer_question
from ..database import get_db
from ..schemas.ai import AssistantAnswer, AssistantAsk
from ..scoping import is_manager, scoped_audit_ids, scoped_finding_ids
from ..serializers import audit_score, risk_level
from .deps import get_current_user

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _build_context(db: Session, user: models.Utilisateur) -> str:
    """Résumé compact et à jour des données, respectant le périmètre du rôle."""
    audits_q = db.query(models.Audit)
    findings_q = db.query(models.NonConformite)
    actions_q = db.query(models.ActionCorrective)
    risks_q = db.query(models.Risque)

    scope_note = "Périmètre : toute l'organisation."
    if is_manager(user):
        allowed_audits = scoped_audit_ids(db, user) or {-1}
        allowed_findings = scoped_finding_ids(db, user) or {-1}
        dept = db.get(models.Departement, user.id_departement)
        scope_note = f"Périmètre : département « {dept.nom if dept else '?'} » uniquement."
        audits_q = audits_q.filter(models.Audit.id_audit.in_(allowed_audits))
        findings_q = findings_q.filter(models.NonConformite.id_non_conformite.in_(allowed_findings))
        actions_q = actions_q.filter(models.ActionCorrective.id_non_conformite.in_(allowed_findings))
        risks_q = risks_q.filter(models.Risque.id_non_conformite.in_(allowed_findings))

    audits = audits_q.all()
    findings = findings_q.all()
    actions = actions_q.all()
    risks = risks_q.all()
    departments = db.query(models.Departement).all()

    closed = [a for a in audits if a.statut == "closed"]
    lines: list[str] = [scope_note, ""]

    lines.append(f"AUDITS ({len(audits)} au total) :")
    lines.append(f"  - clôturés : {len(closed)}, en cours : {len([a for a in audits if a.statut=='in_progress'])}, planifiés : {len([a for a in audits if a.statut=='draft'])}")
    for a in audits[:15]:
        dept = db.get(models.Departement, a.id_departement)
        lines.append(f"  - « {a.titre} » — département {dept.nom if dept else '?'}, statut {a.statut}, score {audit_score(a, db)}%")

    lines.append("")
    lines.append(f"NON-CONFORMITÉS ({len(findings)} au total) :")
    sev: dict[str, int] = {}
    for f in findings:
        sev[f.gravite or 'medium'] = sev.get(f.gravite or 'medium', 0) + 1
    lines.append(f"  - par gravité : {sev}")
    lines.append(f"  - ouvertes/en attente : {len([f for f in findings if f.statut in ('open','action_pending')])}")
    for f in findings[:12]:
        lines.append(f"  - [{f.gravite}] {f.statut} : {(f.description or f.titre or '')[:90]}")

    lines.append("")
    act_status: dict[str, int] = {}
    for a in actions:
        act_status[a.statut or 'todo'] = act_status.get(a.statut or 'todo', 0) + 1
    lines.append(f"ACTIONS CORRECTIVES ({len(actions)}) — par statut : {act_status}")

    lines.append("")
    lvl: dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for r in risks:
        crit = r.criticite if r.criticite is not None else (r.impact or 1) * (r.probabilite or 1)
        lvl[risk_level(crit)] += 1
    lines.append(f"RISQUES ({len(risks)}) — par criticité : {lvl}")

    if not is_manager(user):
        lines.append("")
        lines.append("DÉPARTEMENTS — taux de conformité (moyenne des audits clôturés) :")
        for d in departments:
            d_closed = [a for a in closed if a.id_departement == d.id_departement]
            rate = round(sum(audit_score(a, db) for a in d_closed) / len(d_closed)) if d_closed else "—"
            lines.append(f"  - {d.nom} : {rate}% ({len(d_closed)} audits clôturés)")

    return "\n".join(lines)


@router.post("/ask", response_model=AssistantAnswer)
def ask(
    payload: AssistantAsk,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question vide")
    context = _build_context(db, current_user)
    try:
        answer = answer_question(payload.question.strip(), context)
    except AINotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Assistant IA indisponible : {exc}")
    return AssistantAnswer(answer=answer)

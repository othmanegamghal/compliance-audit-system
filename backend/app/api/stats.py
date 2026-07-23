from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..scoping import is_manager, scoped_audit_ids, scoped_finding_ids
from ..serializers import audit_score, risk_level
from .deps import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/kpis")
def kpis(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    # A manager only sees KPIs for their own department.
    if is_manager(current_user):
        allowed_audits = scoped_audit_ids(db, current_user) or set()
        allowed_findings = scoped_finding_ids(db, current_user) or set()
        audits = db.query(models.Audit).filter(models.Audit.id_audit.in_(allowed_audits)).all()
        findings = db.query(models.NonConformite).filter(models.NonConformite.id_non_conformite.in_(allowed_findings)).all()
        actions = db.query(models.ActionCorrective).filter(models.ActionCorrective.id_non_conformite.in_(allowed_findings)).all()
        risks = db.query(models.Risque).filter(models.Risque.id_non_conformite.in_(allowed_findings)).all()
        departments = db.query(models.Departement).filter(models.Departement.id_departement == current_user.id_departement).all()
    else:
        audits = db.query(models.Audit).all()
        findings = db.query(models.NonConformite).all()
        actions = db.query(models.ActionCorrective).all()
        risks = db.query(models.Risque).all()
        departments = db.query(models.Departement).all()
    users = db.query(models.Utilisateur).all()

    closed = [a for a in audits if a.statut == "closed"]
    scores = [audit_score(a, db) for a in closed]
    compliance_rate = round(sum(scores) / len(scores)) if scores else 0

    # Findings by category
    findings_by_category: dict[str, int] = {}
    for f in findings:
        cat = db.get(models.CategorieNonConformite, f.id_categorie)
        label = cat.nom if cat else "Autre"
        findings_by_category[label] = findings_by_category.get(label, 0) + 1

    # Findings by severity
    findings_by_severity: dict[str, int] = {}
    for f in findings:
        sev = f.gravite or "medium"
        findings_by_severity[sev] = findings_by_severity.get(sev, 0) + 1

    # Actions by status
    actions_by_status: dict[str, int] = {"todo": 0, "in_progress": 0, "in_review": 0, "completed": 0}
    for a in actions:
        actions_by_status[a.statut or "todo"] = actions_by_status.get(a.statut or "todo", 0) + 1

    # Risks by criticality level
    risks_by_level: dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for r in risks:
        crit = r.criticite if r.criticite is not None else (r.impact or 1) * (r.probabilite or 1)
        risks_by_level[risk_level(crit)] += 1

    # Auditor performance (closed audits count per auditor)
    auditor_perf: list[dict] = []
    for u in users:
        if u.role and u.role.nom == "auditor":
            count = len([a for a in closed if a.id_utilisateur == u.id_utilisateur])
            name = f"{u.prenom} {u.nom}".strip() if u.prenom else u.nom
            auditor_perf.append({"name": name, "audits": count})

    # Department performance (avg compliance of closed audits)
    dept_perf: list[dict] = []
    for d in departments:
        d_closed = [a for a in closed if a.id_departement == d.id_departement]
        d_scores = [audit_score(a, db) for a in d_closed]
        dept_perf.append({
            "name": d.nom,
            "compliance": round(sum(d_scores) / len(d_scores)) if d_scores else 0,
            "audits": len(d_closed),
        })

    return {
        "totalAudits": len(audits),
        "auditsInProgress": len([a for a in audits if a.statut == "in_progress"]),
        "auditsClosed": len(closed),
        "auditsScheduled": len([a for a in audits if a.statut == "draft"]),
        "complianceRate": compliance_rate,
        "totalFindings": len(findings),
        "openFindings": len([f for f in findings if f.statut in ("open", "action_pending")]),
        "findingsByCategory": findings_by_category,
        "findingsBySeverity": findings_by_severity,
        "actionsByStatus": actions_by_status,
        "risksByLevel": risks_by_level,
        "auditorPerformance": auditor_perf,
        "departmentPerformance": dept_perf,
    }

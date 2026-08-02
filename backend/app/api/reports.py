import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from .. import models
from ..ai_service import AINotConfiguredError, active_model, generate_audit_report
from ..config import settings
from ..database import get_db
from ..history_service import log
from ..schemas.report_ai import AIReportOut
from ..serializers import CONFORMITE_TO_VALUE, audit_score, iso
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/reports", tags=["reports"])


def _latest_ai_report(db: Session, audit_id: int) -> models.Rapport | None:
    return (
        db.query(models.Rapport)
        .filter(models.Rapport.id_audit == audit_id, models.Rapport.type == "ai_report")
        .order_by(models.Rapport.id_rapport.desc())
        .first()
    )


@router.post("/audits/{audit_id}/generate-ai", response_model=AIReportOut)
def generate_ai_report(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("auditor", "admin", "direction")),
):
    audit = db.get(models.Audit, audit_id)
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit introuvable")

    try:
        content = generate_audit_report(db, audit)
    except AINotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001 — surface a readable message to the UI
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"La génération IA a échoué : {exc}",
        )

    rapport = models.Rapport(
        id_audit=audit_id,
        id_utilisateur=current_user.id_utilisateur,
        type="ai_report",
        nom_fichier=f"rapport_ia_audit_{audit_id}.json",
        contenu=json.dumps(content, ensure_ascii=False),
    )
    db.add(rapport)
    db.commit()
    db.refresh(rapport)
    log(db, current_user.id_utilisateur, "generate_ai_report", f"Rapport IA généré pour l'audit \"{audit.titre}\".", audit_id=audit_id)
    db.commit()

    return AIReportOut(
        auditId=str(audit_id),
        generatedAt=iso(rapport.date_generation) or "",
        model=active_model(),
        **content,
    )


@router.get("/audits/{audit_id}/ai", response_model=AIReportOut | None)
def get_ai_report(audit_id: int, db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    rapport = _latest_ai_report(db, audit_id)
    if rapport is None or not rapport.contenu:
        return None
    content = json.loads(rapport.contenu)
    return AIReportOut(
        auditId=str(audit_id),
        generatedAt=iso(rapport.date_generation) or "",
        model=active_model(),
        **content,
    )

VALUE_LABEL = {"yes": "Conforme", "partial": "Partiel", "no": "Non conforme", None: "N/A"}


@router.get("/audits/{audit_id}/pdf")
def audit_pdf(audit_id: int, db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    audit = db.get(models.Audit, audit_id)
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit introuvable")

    dept = db.get(models.Departement, audit.id_departement)
    auditor = db.get(models.Utilisateur, audit.id_utilisateur)
    template = db.get(models.ModeleChecklist, audit.id_modele) if audit.id_modele else None
    reponses = db.query(models.ReponseAudit).filter(models.ReponseAudit.id_audit == audit_id).all()
    findings = db.query(models.NonConformite).filter(models.NonConformite.id_audit == audit_id).all()
    score = audit_score(audit, db)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("t", parent=styles["Title"], textColor=colors.HexColor("#1D4ED8"), fontSize=18)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#0F172A"), fontSize=12)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#475569"))

    elements = []
    elements.append(Paragraph("Rapport d'Audit de Conformité", title_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(audit.titre or "Audit", h2))
    elements.append(Spacer(1, 10))

    auditor_name = ""
    if auditor:
        auditor_name = f"{auditor.prenom or ''} {auditor.nom}".strip()

    meta = [
        ["Département", dept.nom if dept else "—"],
        ["Auditeur", auditor_name or "—"],
        ["Modèle de checklist", template.nom if template else "—"],
        ["Statut", audit.statut or "—"],
        ["Date de clôture", iso(audit.date_fin) or "—"],
        ["Score de conformité", f"{score}%"],
    ]
    meta_table = Table(meta, colWidths=[5 * cm, 11 * cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EFF6FF")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1E3A8A")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    # AI-generated synthesis (if a report was generated)
    ai_rapport = _latest_ai_report(db, audit_id)
    if ai_rapport and ai_rapport.contenu:
        ai = json.loads(ai_rapport.contenu)
        elements.append(Paragraph("Synthèse (générée par IA)", h2))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(ai.get("executiveSummary", ""), small))
        elements.append(Spacer(1, 8))

        def _bullets(title: str, items: list[str]):
            elements.append(Paragraph(title, ParagraphStyle("h3", parent=small, fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#1E3A8A"))))
            if items:
                elements.append(ListFlowable(
                    [ListItem(Paragraph(it, small), leftIndent=6) for it in items],
                    bulletType="bullet", start="•", leftIndent=10,
                ))
            elements.append(Spacer(1, 8))

        _bullets("Constats majeurs", ai.get("majorFindings", []))
        _bullets("Recommandations", ai.get("recommendations", []))
        if ai.get("conclusion"):
            elements.append(Paragraph("Conclusion", ParagraphStyle("h3c", parent=small, fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#1E3A8A"))))
            elements.append(Paragraph(ai["conclusion"], small))
        elements.append(Spacer(1, 16))

    # Answers table
    elements.append(Paragraph("Réponses de la checklist", h2))
    elements.append(Spacer(1, 6))
    q_map = {}
    if template:
        for q in template.questions:
            q_map[q.id_question] = q.libelle

    rows = [["#", "Question", "Réponse", "Commentaire"]]
    for i, r in enumerate(reponses, start=1):
        value = CONFORMITE_TO_VALUE.get(r.conformite)
        rows.append([
            str(i),
            Paragraph(q_map.get(r.id_question, "—"), small),
            VALUE_LABEL.get(value, "N/A"),
            Paragraph(r.commentaire or "—", small),
        ])
    if len(rows) == 1:
        rows.append(["—", "Aucune réponse enregistrée", "", ""])
    ans_table = Table(rows, colWidths=[1 * cm, 8 * cm, 2.5 * cm, 4.5 * cm], repeatRows=1)
    ans_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D4ED8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    elements.append(ans_table)
    elements.append(Spacer(1, 16))

    # Findings
    elements.append(Paragraph("Non-conformités relevées", h2))
    elements.append(Spacer(1, 6))
    f_rows = [["Gravité", "Statut", "Description"]]
    for f in findings:
        f_rows.append([
            (f.gravite or "—").capitalize(),
            (f.statut or "—"),
            Paragraph(f.description or "—", small),
        ])
    if len(f_rows) == 1:
        f_rows.append(["—", "—", "Aucune non-conformité"])
    f_table = Table(f_rows, colWidths=[2.5 * cm, 3 * cm, 10.5 * cm], repeatRows=1)
    f_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#B45309")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(f_table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Généré automatiquement par Compliance.io — Plateforme de gestion des audits.", small))

    doc.build(elements)
    buffer.seek(0)

    filename = f"audit_{audit_id}_report.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audits/csv")
def audits_csv(db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    audits = db.query(models.Audit).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Titre", "Département", "Auditeur", "Statut", "Score", "Date clôture"])
    for a in audits:
        dept = db.get(models.Departement, a.id_departement)
        auditor = db.get(models.Utilisateur, a.id_utilisateur)
        auditor_name = f"{auditor.prenom or ''} {auditor.nom}".strip() if auditor else ""
        writer.writerow([
            a.id_audit,
            a.titre or "",
            dept.nom if dept else "",
            auditor_name,
            a.statut or "",
            f"{audit_score(a, db)}%",
            iso(a.date_fin) or "",
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="audits_export.csv"'},
    )


@router.get("/findings/csv")
def findings_csv(db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    findings = db.query(models.NonConformite).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Titre", "Gravité", "Statut", "Catégorie", "Date création"])
    for f in findings:
        cat = db.get(models.CategorieNonConformite, f.id_categorie)
        writer.writerow([
            f.id_non_conformite,
            f.titre or "",
            f.gravite or "",
            f.statut or "",
            cat.nom if cat else "",
            iso(f.date_creation) or "",
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="findings_export.csv"'},
    )

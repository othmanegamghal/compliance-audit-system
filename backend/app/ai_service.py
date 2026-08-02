"""Génération IA du rapport d'audit.

Fournisseur par défaut : **Groq** (gratuit, sans carte bancaire, modèles
open-source Llama). Repli optionnel sur **Anthropic Claude** si une clé
ANTHROPIC_API_KEY est fournie.

À la clôture d'un audit, on envoie au LLM toutes les réponses, les
non-conformités et le taux de conformité, et on récupère une synthèse
professionnelle structurée (résumé exécutif, constats majeurs,
recommandations, conclusion).
"""
from __future__ import annotations

import json

import httpx
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from . import models
from .config import settings
from .serializers import CONFORMITE_TO_VALUE, audit_score


class AINotConfiguredError(Exception):
    """Levée quand aucun fournisseur IA n'est configuré."""


class _ParsedReport(BaseModel):
    executiveSummary: str
    majorFindings: list[str]
    recommendations: list[str]
    conclusion: str


VALUE_LABEL = {"yes": "Conforme", "partial": "Partiellement conforme", "no": "Non conforme", None: "Non évalué"}

SYSTEM_PROMPT = (
    "Tu es un auditeur senior en conformité (ISO 27001, GDPR, ISO 9001). "
    "Tu rédiges des rapports d'audit clairs, professionnels et exploitables, en français. "
    "Ton style est factuel, structuré et orienté action. Base-toi UNIQUEMENT sur les données "
    "fournies ; n'invente aucun constat. Le résumé exécutif fait 3 à 5 phrases. Les constats "
    "majeurs et les recommandations sont des phrases complètes, concrètes et priorisées."
)

# The models must emit exactly this JSON shape.
JSON_INSTRUCTION = (
    "Réponds UNIQUEMENT avec un objet JSON valide (aucun texte autour), au format exact :\n"
    '{\n'
    '  "executiveSummary": "résumé exécutif en 3 à 5 phrases",\n'
    '  "majorFindings": ["constat 1", "constat 2"],\n'
    '  "recommendations": ["recommandation 1", "recommandation 2"],\n'
    '  "conclusion": "conclusion en 2 à 3 phrases"\n'
    '}'
)


def _build_user_prompt(db: Session, audit: models.Audit) -> str:
    dept = db.get(models.Departement, audit.id_departement)
    template = db.get(models.ModeleChecklist, audit.id_modele) if audit.id_modele else None
    reponses = db.query(models.ReponseAudit).filter(models.ReponseAudit.id_audit == audit.id_audit).all()
    findings = db.query(models.NonConformite).filter(models.NonConformite.id_audit == audit.id_audit).all()
    score = audit_score(audit, db)

    q_map = {q.id_question: q.libelle for q in (template.questions if template else [])}

    lines: list[str] = []
    lines.append(f"# Audit : {audit.titre or 'Sans titre'}")
    lines.append(f"- Département audité : {dept.nom if dept else '—'}")
    lines.append(f"- Référentiel / modèle : {template.nom if template else '—'}")
    lines.append(f"- Taux de conformité global : {score}%")
    lines.append("")
    lines.append("## Réponses à la checklist")
    if reponses:
        for r in reponses:
            value = CONFORMITE_TO_VALUE.get(r.conformite)
            lines.append(f"- [{VALUE_LABEL.get(value, 'Non évalué')}] {q_map.get(r.id_question, 'Question')}")
            if r.commentaire:
                lines.append(f"    Commentaire auditeur : {r.commentaire}")
    else:
        lines.append("- Aucune réponse enregistrée.")
    lines.append("")
    lines.append("## Non-conformités relevées")
    if findings:
        for f in findings:
            lines.append(f"- (Gravité : {f.gravite or 'n/a'}) {f.description or f.titre or 'Non-conformité'}")
    else:
        lines.append("- Aucune non-conformité automatique relevée.")
    lines.append("")
    lines.append(
        "Rédige le rapport d'audit : un résumé exécutif, la liste des constats majeurs, "
        "la liste des recommandations d'amélioration, et une conclusion.\n\n" + JSON_INSTRUCTION
    )
    return "\n".join(lines)


def _validate(data: dict) -> dict:
    report = _ParsedReport(**data)
    return {
        "executiveSummary": report.executiveSummary,
        "majorFindings": report.majorFindings,
        "recommendations": report.recommendations,
        "conclusion": report.conclusion,
    }


def _generate_with_groq(system: str, prompt: str) -> dict:
    """Appelle l'API Groq (compatible OpenAI) en HTTP direct — aucun SDK requis."""
    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
            "max_tokens": 2000,
        },
        timeout=60.0,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Groq {resp.status_code}: {resp.text[:300]}")
    content = resp.json()["choices"][0]["message"]["content"]
    return _validate(json.loads(content))


def _generate_with_anthropic(system: str, prompt: str) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.parse(
        model=settings.ai_model,
        max_tokens=4000,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": prompt}],
        output_format=_ParsedReport,
    )
    report = response.parsed_output
    if report is None:
        raise RuntimeError("Le modèle n'a pas retourné de rapport structuré.")
    return _validate(report.model_dump())


# ---------------------------------------------------------------------------
# Helpers génériques réutilisables (chat texte / chat JSON) — Groq ou Anthropic
# ---------------------------------------------------------------------------

def _require_provider() -> str:
    provider = active_provider()
    if provider is None:
        raise AINotConfiguredError(
            "La génération IA n'est pas configurée. Créez une clé API GRATUITE sur "
            "https://console.groq.com puis renseignez GROQ_API_KEY dans backend/.env "
            "et redémarrez le serveur."
        )
    return provider


def _groq_chat(system: str, prompt: str, max_tokens: int, json_mode: bool) -> str:
    body: dict = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": max_tokens,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json=body,
        timeout=60.0,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Groq {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _anthropic_chat(system: str, prompt: str, max_tokens: int) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.ai_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in response.content if getattr(b, "type", "") == "text")


def complete_text(system: str, prompt: str, max_tokens: int = 900) -> str:
    """Réponse en texte libre (assistant conversationnel)."""
    provider = _require_provider()
    if provider == "groq":
        return _groq_chat(system, prompt, max_tokens, json_mode=False).strip()
    return _anthropic_chat(system, prompt, max_tokens).strip()


def complete_json(system: str, prompt: str, max_tokens: int = 1500) -> dict:
    """Réponse structurée JSON (checklist, action corrective...)."""
    provider = _require_provider()
    if provider == "groq":
        return json.loads(_groq_chat(system, prompt, max_tokens, json_mode=True))
    # Anthropic : on demande explicitement du JSON puis on parse.
    text = _anthropic_chat(system + "\nRéponds UNIQUEMENT avec du JSON valide.", prompt, max_tokens)
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(text)


# ---------------------------------------------------------------------------
# 1) Générateur de checklist par IA
# ---------------------------------------------------------------------------

CHECKLIST_SYSTEM = (
    "Tu es un expert en normes de conformité et systèmes de management (ISO 27001, "
    "GDPR, ISO 9001, etc.). Tu conçois des checklists d'audit claires et pertinentes, en français."
)


def generate_checklist(topic: str, count: int = 8) -> dict:
    count = max(3, min(15, count))
    prompt = (
        f"Conçois une checklist d'audit sur le thème : « {topic} ». "
        f"Génère exactement {count} questions de contrôle pertinentes, réparties par catégorie.\n\n"
        "Réponds UNIQUEMENT avec un objet JSON au format exact :\n"
        '{\n'
        '  "name": "nom court du modèle de checklist",\n'
        '  "description": "1 à 2 phrases décrivant le périmètre",\n'
        '  "questions": [\n'
        '    {"text": "question de contrôle formulée clairement", "category": "catégorie"}\n'
        '  ]\n'
        '}'
    )
    data = complete_json(CHECKLIST_SYSTEM, prompt, max_tokens=2000)
    # Tolère quelques variantes de structure renvoyées par le modèle.
    raw_questions = data.get("questions") or data.get("checklist") or data.get("items") or []
    questions = []
    for q in raw_questions:
        if isinstance(q, dict):
            text = str(q.get("text") or q.get("question") or q.get("libelle") or "").strip()
            category = str(q.get("category") or q.get("categorie") or "Général").strip()
        else:
            text, category = str(q).strip(), "Général"
        if text:
            questions.append({"text": text, "category": category or "Général"})
    name = data.get("name") or data.get("nom") or topic
    return {
        "name": str(name)[:100],
        "description": str(data.get("description") or data.get("desc") or ""),
        "questions": questions,
    }


# ---------------------------------------------------------------------------
# 2) Suggestion d'action corrective
# ---------------------------------------------------------------------------

ACTION_SYSTEM = (
    "Tu es un responsable qualité/conformité. Pour une non-conformité donnée, tu proposes "
    "UNE action corrective concrète, réaliste et actionnable, en français, et un délai raisonnable en jours."
)


def suggest_corrective_action(description: str, severity: str | None) -> dict:
    prompt = (
        f"Non-conformité (gravité : {severity or 'non précisée'}) :\n{description}\n\n"
        "Propose une action corrective concrète et un délai réaliste.\n"
        "Réponds UNIQUEMENT avec un objet JSON au format exact :\n"
        '{"action": "description de l\'action corrective en 1 à 2 phrases", "dueInDays": 14}'
    )
    data = complete_json(ACTION_SYSTEM, prompt, max_tokens=500)
    try:
        due = int(data.get("dueInDays", 14))
    except (TypeError, ValueError):
        due = 14
    return {"action": str(data.get("action", "")).strip(), "dueInDays": max(1, min(180, due))}


# ---------------------------------------------------------------------------
# 3) Assistant conversationnel (répond à partir d'un contexte de données)
# ---------------------------------------------------------------------------

ASSISTANT_SYSTEM = (
    "Tu es l'assistant IA d'une plateforme de gestion des audits et de la conformité. "
    "Tu réponds en français, de façon concise et professionnelle, en te basant UNIQUEMENT sur "
    "les données de contexte fournies. Si l'information n'est pas dans le contexte, dis-le "
    "clairement au lieu d'inventer. Donne des chiffres précis quand ils sont disponibles."
)


def answer_question(question: str, context: str) -> str:
    prompt = (
        "Voici l'état actuel des données de la plateforme :\n\n"
        f"{context}\n\n"
        f"Question de l'utilisateur : {question}"
    )
    return complete_text(ASSISTANT_SYSTEM, prompt, max_tokens=700)


def active_provider() -> str | None:
    if settings.groq_api_key:
        return "groq"
    if settings.anthropic_api_key:
        return "anthropic"
    return None


def active_model() -> str:
    """Nom lisible du modèle utilisé (pour l'affichage)."""
    if settings.groq_api_key:
        return settings.groq_model
    if settings.anthropic_api_key:
        return settings.ai_model
    return "—"


def generate_audit_report(db: Session, audit: models.Audit) -> dict:
    """Génère le rapport structuré via le fournisseur configuré."""
    provider = active_provider()
    if provider is None:
        raise AINotConfiguredError(
            "La génération IA n'est pas configurée. Créez une clé API GRATUITE sur "
            "https://console.groq.com puis renseignez GROQ_API_KEY dans backend/.env "
            "et redémarrez le serveur."
        )

    system = SYSTEM_PROMPT
    prompt = _build_user_prompt(db, audit)

    try:
        if provider == "groq":
            return _generate_with_groq(system, prompt)
        return _generate_with_anthropic(system, prompt)
    except ValidationError as exc:
        raise RuntimeError(f"Réponse IA mal formée : {exc}")

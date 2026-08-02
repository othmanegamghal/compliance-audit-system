from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models
from ..ai_service import AINotConfiguredError, generate_checklist
from ..database import get_db
from ..schemas.ai import ChecklistDraft, ChecklistGenRequest
from ..schemas.template import TemplateCreate, TemplateOut
from ..serializers import template_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("/ai-draft", response_model=ChecklistDraft)
def ai_checklist_draft(
    payload: ChecklistGenRequest,
    _: models.Utilisateur = Depends(require_roles("admin", "auditor")),
):
    if not payload.topic.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Thème requis")
    try:
        draft = generate_checklist(payload.topic.strip(), payload.count)
    except AINotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Génération IA échouée : {exc}")
    return draft


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    templates = db.query(models.ModeleChecklist).all()
    return [template_to_out(t) for t in templates]


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(require_roles("admin", "auditor")),
):
    template = models.ModeleChecklist(
        nom=payload.name,
        description=payload.description,
        id_utilisateur_creation=current_user.id_utilisateur,
    )
    db.add(template)
    db.flush()

    for q in payload.questions:
        db.add(
            models.QuestionChecklist(
                id_modele=template.id_modele,
                libelle=q.text,
                categorie=q.category,
            )
        )

    db.commit()
    db.refresh(template)
    return template_to_out(template)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.misc import CategoryCreate, CategoryOut
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/categories", tags=["categories"])


def category_to_out(c: models.CategorieNonConformite, db: Session) -> CategoryOut:
    count = db.query(models.NonConformite).filter(models.NonConformite.id_categorie == c.id_categorie).count()
    return CategoryOut(id=str(c.id_categorie), name=c.nom, description=c.description, findingsCount=count)


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _: models.Utilisateur = Depends(get_current_user)):
    cats = db.query(models.CategorieNonConformite).all()
    return [category_to_out(c, db) for c in cats]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction", "auditor")),
):
    cat = models.CategorieNonConformite(nom=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return category_to_out(cat, db)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    cat = db.get(models.CategorieNonConformite, category_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie introuvable")
    in_use = db.query(models.NonConformite).filter(models.NonConformite.id_categorie == category_id).count()
    if in_use:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Catégorie utilisée par des non-conformités")
    db.delete(cat)
    db.commit()

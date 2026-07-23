from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..database import get_db
from ..schemas.user import UserCreate, UserOut, UserUpdate
from ..security import hash_password
from ..serializers import user_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    users = db.query(models.Utilisateur).all()
    return [user_to_out(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin")),
):
    role = db.query(models.Role).filter(models.Role.nom == payload.role).first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rôle inconnu: {payload.role}")

    if payload.departmentId:
        department_id = int(payload.departmentId)
        if db.get(models.Departement, department_id) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inconnu")
    else:
        first_department = db.query(models.Departement).first()
        if first_department is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun département existant")
        department_id = first_department.id_departement

    existing = db.query(models.Utilisateur).filter(models.Utilisateur.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")

    name_parts = payload.name.strip().split(" ", 1)
    prenom = name_parts[0]
    nom = name_parts[1] if len(name_parts) > 1 else name_parts[0]

    user = models.Utilisateur(
        id_role=role.id_role,
        id_departement=department_id,
        nom=nom,
        prenom=prenom,
        email=payload.email,
        mot_de_passe=hash_password(payload.password or settings.demo_password),
        photo=payload.avatar,
        actif=payload.status != "inactive",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(get_current_user),
):
    user = db.get(models.Utilisateur, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    if current_user.role.nom != "admin" and current_user.id_utilisateur != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée")

    if payload.name is not None:
        name_parts = payload.name.strip().split(" ", 1)
        user.prenom = name_parts[0]
        user.nom = name_parts[1] if len(name_parts) > 1 else name_parts[0]
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        role = db.query(models.Role).filter(models.Role.nom == payload.role).first()
        if role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rôle inconnu: {payload.role}")
        user.id_role = role.id_role
    if payload.departmentId is not None:
        user.id_departement = int(payload.departmentId)
    if payload.avatar is not None:
        user.photo = payload.avatar
    if payload.status is not None:
        user.actif = payload.status != "inactive"
    if payload.language is not None:
        user.langue = payload.language
    if payload.timezone is not None:
        user.timezone = payload.timezone

    db.commit()
    db.refresh(user)
    return user_to_out(user)

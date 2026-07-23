from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.auth import (
    DepartmentOption,
    LoginRequest,
    RegisterOptions,
    RegisterRequest,
    TokenResponse,
)
from ..schemas.user import UserOut
from ..security import create_access_token, hash_password, verify_password
from ..serializers import user_to_out
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Roles a visitor may pick when self-registering (never admin/direction).
SELF_SIGNUP_ROLES = ["auditor", "manager"]


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Utilisateur).filter(models.Utilisateur.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.mot_de_passe):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if not user.actif:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte désactivé")

    token = create_access_token(subject=str(user.id_utilisateur))
    return TokenResponse(access_token=token, user=user_to_out(user))


@router.get("/register-options", response_model=RegisterOptions)
def register_options(db: Session = Depends(get_db)):
    departments = db.query(models.Departement).all()
    return RegisterOptions(
        departments=[DepartmentOption(id=str(d.id_departement), name=d.nom) for d in departments],
        roles=SELF_SIGNUP_ROLES,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in SELF_SIGNUP_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rôle non autorisé à l'inscription")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe trop court (min. 6 caractères)")

    role = db.query(models.Role).filter(models.Role.nom == payload.role).first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rôle inconnu")
    department = db.get(models.Departement, int(payload.departmentId))
    if department is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inconnu")
    if db.query(models.Utilisateur).filter(models.Utilisateur.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")

    name_parts = payload.name.strip().split(" ", 1)
    user = models.Utilisateur(
        id_role=role.id_role,
        id_departement=department.id_departement,
        prenom=name_parts[0],
        nom=name_parts[1] if len(name_parts) > 1 else name_parts[0],
        email=payload.email,
        mot_de_passe=hash_password(payload.password),
        actif=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id_utilisateur))
    return TokenResponse(access_token=token, user=user_to_out(user))


@router.get("/me", response_model=UserOut)
def me(current_user: models.Utilisateur = Depends(get_current_user)):
    return user_to_out(current_user)

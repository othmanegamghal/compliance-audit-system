from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.department import DepartmentCreate, DepartmentOut
from ..serializers import department_to_out
from .deps import get_current_user, require_roles

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    departments = db.query(models.Departement).all()
    return [department_to_out(d, db) for d in departments]


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin")),
):
    department = models.Departement(nom=payload.name, code=payload.code, description=payload.description)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department_to_out(department, db)

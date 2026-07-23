from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.misc import PermissionOut, RolePermissionsOut
from .deps import require_roles

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionOut])
def list_permissions(
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    perms = db.query(models.Permission).all()
    return [PermissionOut(id=str(p.id_permission), name=p.nom, description=p.description) for p in perms]


@router.get("/roles", response_model=list[RolePermissionsOut])
def role_permissions(
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(require_roles("admin", "direction")),
):
    roles = db.query(models.Role).all()
    result: list[RolePermissionsOut] = []
    for role in roles:
        perm_rows = (
            db.query(models.Permission.nom)
            .join(models.RolePermission, models.RolePermission.id_permission == models.Permission.id_permission)
            .filter(models.RolePermission.id_role == role.id_role)
            .all()
        )
        result.append(RolePermissionsOut(role=role.nom, permissions=[r[0] for r in perm_rows]))
    return result

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.notification import NotificationOut
from ..serializers import notification_to_out
from .deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.id_utilisateur == current_user.id_utilisateur)
        .order_by(models.Notification.id_notification.desc())
        .all()
    )
    return [notification_to_out(n) for n in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.Utilisateur = Depends(get_current_user),
):
    notification = db.get(models.Notification, notification_id)
    if notification is None or notification.id_utilisateur != current_user.id_utilisateur:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification introuvable")
    notification.lue = True
    db.commit()
    db.refresh(notification)
    return notification_to_out(notification)


@router.patch("/read-all", response_model=list[NotificationOut])
def mark_all_read(db: Session = Depends(get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.id_utilisateur == current_user.id_utilisateur)
        .all()
    )
    for n in notifications:
        n.lue = True
    db.commit()
    return [notification_to_out(n) for n in notifications]

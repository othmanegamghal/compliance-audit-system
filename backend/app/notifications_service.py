from sqlalchemy.orm import Session

from . import models


def notify(db: Session, user_id: int | None, title: str, message: str, type_: str = "info", audit_id: int | None = None) -> None:
    if user_id is None:
        return
    notification = models.Notification(
        id_utilisateur=user_id,
        id_audit=audit_id,
        titre=title,
        message=message,
        type=type_,
        lue=False,
    )
    db.add(notification)

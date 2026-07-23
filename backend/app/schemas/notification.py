from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    date: str
    read: bool
    type: str

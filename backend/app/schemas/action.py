from pydantic import BaseModel


class ActionOut(BaseModel):
    id: str
    nonConformityId: str
    text: str
    status: str
    assignee: str
    dueDate: str | None = None
    completedAt: str | None = None


class ActionCreate(BaseModel):
    nonConformityId: str
    text: str
    status: str = "todo"
    assignee: str
    dueDate: str | None = None


class ActionUpdate(BaseModel):
    status: str

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    projectId: str
    name: str
    version: str | None = None
    type: str | None = None
    path: str | None = None


class DocumentCreate(BaseModel):
    projectId: str
    name: str
    version: str | None = None
    type: str | None = None
    path: str | None = None

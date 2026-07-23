from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    findingsCount: int = 0


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None


class CommentOut(BaseModel):
    id: str
    userId: str
    userName: str
    userAvatar: str | None = None
    auditId: str | None = None
    findingId: str | None = None
    content: str
    date: str


class CommentCreate(BaseModel):
    auditId: str | None = None
    findingId: str | None = None
    content: str


class HistoryOut(BaseModel):
    id: str
    userId: str
    userName: str
    action: str
    description: str | None = None
    date: str
    ip: str | None = None
    auditId: str | None = None


class PermissionOut(BaseModel):
    id: str
    name: str
    description: str | None = None


class RolePermissionsOut(BaseModel):
    role: str
    permissions: list[str]

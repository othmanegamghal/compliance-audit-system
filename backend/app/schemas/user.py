from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    departmentId: str | None = None
    avatar: str | None = None
    status: str
    language: str = "en"
    timezone: str = "utc+0"


class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    departmentId: str | None = None
    password: str | None = None
    avatar: str | None = None
    status: str = "active"


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    departmentId: str | None = None
    avatar: str | None = None
    status: str | None = None
    language: str | None = None
    timezone: str | None = None

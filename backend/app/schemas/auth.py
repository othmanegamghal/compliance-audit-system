from pydantic import BaseModel

from .user import UserOut


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # only 'auditor' or 'manager' allowed for self sign-up
    departmentId: str


class DepartmentOption(BaseModel):
    id: str
    name: str


class RegisterOptions(BaseModel):
    departments: list[DepartmentOption]
    roles: list[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

from pydantic import BaseModel


class DepartmentOut(BaseModel):
    id: str
    name: str
    code: str | None = None
    managerId: str | None = None
    complianceRate: int


class DepartmentCreate(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None

from pydantic import BaseModel


class RiskOut(BaseModel):
    id: str
    nonConformityId: str
    name: str | None = None
    description: str | None = None
    impact: int
    probability: int
    criticality: int
    level: str  # low / medium / high / critical (derived from criticality)
    status: str | None = None


class RiskCreate(BaseModel):
    nonConformityId: str
    name: str | None = None
    description: str | None = None
    impact: int = 1
    probability: int = 1
    status: str | None = "open"


class RiskUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    impact: int | None = None
    probability: int | None = None
    status: str | None = None


class MitigationOut(BaseModel):
    id: str
    riskId: str
    description: str | None = None
    dueDate: str | None = None
    status: str | None = None


class MitigationCreate(BaseModel):
    riskId: str
    description: str
    dueDate: str | None = None
    status: str | None = "todo"

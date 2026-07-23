from pydantic import BaseModel


class ProjectOut(BaseModel):
    id: str
    departmentId: str
    name: str
    description: str | None = None
    startDate: str | None = None
    budget: float | None = None
    priority: str | None = None
    status: str | None = None
    objectivesCount: int = 0


class ProjectCreate(BaseModel):
    departmentId: str
    name: str
    description: str | None = None
    startDate: str | None = None
    budget: float | None = None
    priority: str | None = None
    status: str | None = "active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    startDate: str | None = None
    budget: float | None = None
    priority: str | None = None
    status: str | None = None


class ObjectiveOut(BaseModel):
    id: str
    projectId: str
    departmentId: str
    name: str
    description: str | None = None
    targetValue: float | None = None
    startDate: str | None = None
    endDate: str | None = None
    status: str | None = None


class ObjectiveCreate(BaseModel):
    projectId: str
    name: str
    description: str | None = None
    targetValue: float | None = None
    startDate: str | None = None
    endDate: str | None = None
    status: str | None = "in_progress"

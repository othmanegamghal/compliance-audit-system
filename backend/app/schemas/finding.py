from pydantic import BaseModel


class FindingOut(BaseModel):
    id: str
    auditId: str | None = None
    questionId: str | None = None
    description: str
    severity: str
    status: str
    assignedTo: str | None = None
    correctiveActionText: str | None = None
    correctiveActionDueDate: str | None = None
    createdAt: str
    resolvedAt: str | None = None
    evidenceUrl: str | None = None


class FindingUpdate(BaseModel):
    status: str
    correctiveActionText: str | None = None
    correctiveActionDueDate: str | None = None

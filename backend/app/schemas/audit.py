from typing import Literal

from pydantic import BaseModel

AnswerValue = Literal["yes", "no", "partial"] | None


class AuditAnswerOut(BaseModel):
    questionId: str
    value: AnswerValue = None
    comment: str | None = None
    evidenceFileName: str | None = None
    evidenceUrl: str | None = None


class AuditOut(BaseModel):
    id: str
    name: str
    departmentId: str
    templateId: str | None = None
    auditorId: str
    status: str
    createdAt: str
    completedAt: str | None = None
    answers: list[AuditAnswerOut]
    score: int


class AuditCreate(BaseModel):
    name: str
    departmentId: str
    templateId: str
    auditorId: str
    status: str = "draft"


class AnswersSubmit(BaseModel):
    answers: list[AuditAnswerOut]
    isFinalSubmit: bool = False

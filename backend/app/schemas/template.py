from pydantic import BaseModel


class QuestionOut(BaseModel):
    id: str
    text: str
    category: str | None = None


class QuestionCreate(BaseModel):
    text: str
    category: str | None = None


class TemplateOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    questions: list[QuestionOut]
    createdAt: str
    createdBy: str | None = None


class TemplateCreate(BaseModel):
    name: str
    description: str | None = None
    questions: list[QuestionCreate]

from pydantic import BaseModel


class ChecklistGenRequest(BaseModel):
    topic: str
    count: int = 8


class ChecklistQuestionDraft(BaseModel):
    text: str
    category: str


class ChecklistDraft(BaseModel):
    name: str
    description: str
    questions: list[ChecklistQuestionDraft]


class SuggestActionOut(BaseModel):
    action: str
    dueDate: str  # ISO date (today + dueInDays)


class AssistantAsk(BaseModel):
    question: str


class AssistantAnswer(BaseModel):
    answer: str

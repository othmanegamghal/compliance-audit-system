from pydantic import BaseModel


class AIReportContent(BaseModel):
    """Structured audit report produced by the LLM."""
    executiveSummary: str
    majorFindings: list[str]
    recommendations: list[str]
    conclusion: str


class AIReportOut(AIReportContent):
    auditId: str
    generatedAt: str
    model: str

from pydantic import BaseModel


class UploadResponse(BaseModel):
    fileName: str
    url: str

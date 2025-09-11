from pydantic import BaseModel

class IssueRequest(BaseModel):
    description: str
    priority: str = ""  # optional

class IssueResponse(BaseModel):
    predicted_root_cause: str
    developer_team: str
    priority_order: int

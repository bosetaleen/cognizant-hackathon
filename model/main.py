from fastapi import FastAPI
from .schemas import IssueRequest, IssueResponse  # relative import
from .model import predict_issue                    # relative import

app = FastAPI(title="Issue Prediction API")

@app.get("/")
def root():
    return {"message": "Issue Prediction API is running"}

@app.post("/predict", response_model=IssueResponse)
def predict_issue_endpoint(request: IssueRequest):
    # Call your model function with description and optional priority
    result = predict_issue(request.description, request.priority)
    return result

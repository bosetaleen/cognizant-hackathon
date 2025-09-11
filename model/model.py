import joblib
from pathlib import Path
from .utils import map_priority_to_order, map_root_cause_to_team, PRIORITY_MISSING_FALLBACK
from .schemas import IssueResponse

# BASE_DIR = current folder (model/)
BASE_DIR = Path(__file__).resolve().parent

# Load ML artifacts from BASE_DIR
vectorizer = joblib.load(BASE_DIR / "tfidf_vectorizer.pkl")
model = joblib.load(BASE_DIR / "best_model.pkl")

def predict_issue(description: str, priority: str = "") -> IssueResponse:
    # Transform text
    desc_vec = vectorizer.transform([description])
    predicted_root_cause = model.predict(desc_vec)[0]

    # Map to dev team and priority order
    dev_team = map_root_cause_to_team(predicted_root_cause)
    priority_order = map_priority_to_order(priority) if priority else PRIORITY_MISSING_FALLBACK

    # Return Pydantic model instead of dict
    return IssueResponse(
        predicted_root_cause=predicted_root_cause,
        developer_team=dev_team,
        priority_order=priority_order
    )

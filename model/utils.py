# app/utils.py

# -------------------------------
# Priority Mapping
# -------------------------------
PRIORITY_ORDER_MAP = {
    "critical": 1,
    "major": 2,
    "minor": 3,
    "trivial": 4,
    "blocker": 5
}
PRIORITY_MISSING_FALLBACK = 6

def map_priority_to_order(val):
    """
    Converts a priority string into a numeric order.
    If value is None or unrecognized, returns fallback.
    """
    if val is None or val.strip() == "":
        return PRIORITY_MISSING_FALLBACK
    return PRIORITY_ORDER_MAP.get(val.strip().lower(), PRIORITY_MISSING_FALLBACK)

# -------------------------------
# Developer Team Mapping
# -------------------------------
DEV_TEAM_MAP = {
    "Deployment Issue": "DevOps Team",
    "Network Issue": "Network Team",
    "Database Issue": "DB Admin",
    "UI Issue": "Frontend Team",
    "Unknown": "Triage Team"
}

def map_root_cause_to_team(root_cause):
    """
    Maps predicted root cause to the responsible developer team.
    Defaults to 'Triage Team' if not recognized.
    """
    return DEV_TEAM_MAP.get(root_cause, "Triage Team")

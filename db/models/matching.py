from typing import Optional

from db.models.job import JobBase
from db.models.user import UserProfile
from pydantic import BaseModel

class MatchRequest(BaseModel):
    user: UserProfile
    jobs: list[JobBase]

class MatchResult(BaseModel):
    job_id: str
    relevance_score: float   # Stage 2 tag‑based score
    semantic_score: Optional[float] = None  # Stage 3
    # ibcf_score: Optional[float] = None  # Stage 4
    combined_score: float
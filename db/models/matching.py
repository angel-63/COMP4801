from typing import Optional

from db.models.job import Job
from db.models.user import User
from pydantic import BaseModel

class MatchResult(BaseModel):
    job: Job
    relevanceScore: float   # Stage 2 tag‑based score
    semanticScore: Optional[float] = None  # Stage 3
    # ibcf_score: Optional[float] = None  # Stage 4
    combinedScore: float
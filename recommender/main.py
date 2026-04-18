import argparse
from recommender.filtering import apply_filters
from recommender.scoring import *
import uvicorn

from fastapi import FastAPI, HTTPException
from db.database import db
from db.models.matching import MatchRequest, MatchResult


app = FastAPI(title="Job Recommendation Engine")

@app.on_event("start")
async def startup_event():
    if not db.connect():
        raise RuntimeError("Failed to connect to MongoDB")
    db.cleanup_old_jobs()
    print("MongoDB ready")

@app.on_event("close")
async def shutdown_event():
    db.close()
    print("MongoDB connection closed")

@app.post("/match", response_model=list[MatchResult])
async def match_jobs(request: MatchRequest):
    user = request.user
    jobs = request.jobs

    # Stage 1: Filter
    filtered = apply_filters(user, jobs)

    results = []
    for job in filtered:
        # Stage 2: tag score
        tag_score = relevance_score(user, job)

        # Stage 3: semantic similarity (optional: can be toggled)
        sem_score = semantic_score(user, job)   # 0..1 range

        # Stage 4: collaborative (if data exists)
        # collab_score = ibcf(user.user_id, job.job_id)

        # Combine: adjust weights as needed
        combined = (tag_score * 0.6) + (sem_score * 0.4) 
        # + (collab_score * 0.1)

        results.append(MatchResult(
            job_id=job.job_id,
            relevance_score=tag_score,
            semantic_score=sem_score,
            # ibcf_score=collab_score,
            combined_score=round(combined, 4)
        ))

    # Sort by combined score descending
    results.sort(key=lambda x: x.combined_score, reverse=True)
    return results

@app.get("/health")
async def health():
    return {"status": "ok"}

def main(args=None):
    parser = argparse.ArgumentParser(description="Job Recommendation Engine")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args(args)
    
    uvicorn.run(
        "recommender.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
    
if __name__ == "__main__":
    main()
import argparse
from bson import Binary
from db.models.job import Job
from recommender.filtering import apply_filters
from recommender.scoring import *
import uvicorn

from fastapi import FastAPI, HTTPException
from db.database import db
from db.models.matching import MatchResult


app = FastAPI(title="Job Recommendation Engine")

@app.on_event("startup")
async def startup_event():
    if not db.connect():
        raise RuntimeError("Failed to connect to MongoDB")
    db.cleanup_old_jobs()
    print("MongoDB ready")

@app.on_event("shutdown")
async def shutdown_event():
    db.close()
    print("MongoDB connection closed")

@app.post("/match", response_model=list[MatchResult])
async def match_jobs(request: User):
    user = request
    jobs_cursor = db.get_collection("job").find()
    jobs = []
    for doc in jobs_cursor:
        # Convert company_logo from bytes to Binary if present
        if "company_logo" in doc and isinstance(doc["company_logo"], bytes):
            doc["company_logo"] = Binary(doc["company_logo"])
        jobs.append(Job(**doc))

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
        combined = compute_hybrid_score(user, job, tag_score, sem_score)

        results.append(MatchResult(
            jobId=str(job.id),
            relevanceScore=tag_score,
            semanticScore=sem_score,
            # ibcf_score=collab_score,
            combinedScore=round(combined, 4)
        ))

    # Sort by combined score descending
    results.sort(key=lambda x: x.combinedScore, reverse=True)
    return results[:21]

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
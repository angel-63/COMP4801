from datetime import datetime

from db.database import db
from db.models.job import JobBase
from db.models.user import UserProfile


# Stage 1
# applies hard filters to remove clearly irrelevant jobs
# not showing jobs user disliked before
def get_disliked_jobs(user_id: str) -> set[str]:
    interactions_collection = db.get_collection('interactions')
    result = interactions_collection.find({'_id': user_id, 'action': 'explicit_no'})
    return set(doc['job_id'] for doc in result)

def apply_filters(user: UserProfile, jobs: list[JobBase]) -> list[JobBase]:
    preference = user.preference_tags
    filtered = []
    for job in jobs:
        if (job.expires_at < datetime.utcnow()) or\
            bool(set(preference.job_function) & set(job.job_function)) or \
            bool(set(preference.employment_type) & set(job.employment_type)) or \
            bool(set(preference.experience_level) & set(job.experience_level)) or\
            (job._id in get_disliked_jobs(user._id)) or\
            (job._id in get_disliked_jobs(user._id)):
            continue
        filtered.append(job)
    return filtered
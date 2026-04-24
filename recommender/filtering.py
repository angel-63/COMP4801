from datetime import datetime
from zoneinfo import ZoneInfo

from db.database import db
from db.models.job import JobBase
from db.models.user import User


# Stage 1
# applies hard filters to remove clearly irrelevant jobs
# not showing jobs user disliked before
def get_disliked_jobs(user_id: str) -> set[str]:
    interactions_collection = db.get_collection('interactions')
    result = interactions_collection.find({'user_id': user_id, 'action': 'explicit_no'})
    return set(doc['_id'] for doc in result)

def get_applied_jobs(user_id: str) -> set[str]:
    interactions_collection = db.get_collection('interactions')
    result = interactions_collection.find({'user_id': user_id, 'action': 'applied'})
    return set(doc['_id'] for doc in result)

def apply_filters(user: User, jobs: list[JobBase]) -> list[JobBase]:
    preference = user.preference_tags
    filtered = []
    disliked = get_disliked_jobs(user.id)
    applied = get_applied_jobs(user.id)
    for job in jobs:
        job_id = job.id
        if (job.expires_at >= datetime.now()) and\
            bool(set(preference.job_function) & set(job.job_function)) and\
            (job.employment_type in preference.employment_type if preference.employment_type is not None else True) and \
            (job.experience_level in preference.experience_level if job.experience_level is not None else True) and\
            (job_id not in disliked) and\
            (job_id not in applied):
                # print("job.employment_type:", repr(job.employment_type), type(job.employment_type))
                # print("preference.employment_type:", [repr(x) for x in preference.employment_type])
                # print("job.expires_at >= now:", job.expires_at >= datetime.now())
                # print("job_function intersection:", bool(set(preference.job_function) & set(job.job_function)))
                filtered.append(job)
    print("number of filtered jobs: ", len(filtered))
    return filtered
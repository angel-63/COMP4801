from db.models.job import JobBase
from sentence_transformers import SentenceTransformer
import numpy as np
from db.models.user import UserProfile

# Stage 2
# computes a relevance score based on tag overlap between user and job
def relevance_score(user: UserProfile, job: JobBase) -> float:
    skill_match = len(set(user.skill_tags) & set(job.skill_tags))
    industry_match = len(set(user.preference_tags.industries) & set(job.company_industries))
    function_match = len(set(user.preference_tags.job_function) & set(job.job_function))
    role_match = len(set(user.preference_tags.role_category) & set(job.role_category))
    return skill_match * 10 + role_match * 5 + function_match * 2 + industry_match

# Stage 3
model = SentenceTransformer('all-MiniLM-L6-v2') 

def encode_text(text: str) -> np.ndarray:
    return model.encode(text)

def cosine_similarity(vec1, vec2) -> float:
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def build_user_summary(user: UserProfile) -> str:
    summary = []
    if user.skill_tags:
        skills = [s.skill for s in user.skill_tags]
        summary.append("Skills: " + " ".join(skills) + ";")
    if user.work_experience:
        summary.append("| Work Experience: ")
        for exp in user.work_experience:
            summary.append(f"{exp.position} at {exp.company};")        
    if user.education:
        summary.append("| Education: ")
        for education in user.education:
            summary.append(f"{education.degree} in {education.field_of_study} from {education.institution};")        
    if user.project:
        summary.append("| Projects: ")
        for proj in user.project:
            summary.append(f"{proj.project_name}: {proj.project_description};")
    if user.certificate:
        summary.append("| Certificates: ")
        for cert in user.certificate:
            summary.append(f"{cert.certificate_name} issued by {cert.issuing_organization};")
    return " ".join(summary)

# semantic similarity of job description and the user profile summary 
def semantic_score(user: UserProfile, job: JobBase) -> float:
    user_text = build_user_summary(user)
    job_text = f"{job.title} {job.description}"
    user_vec = encode_text(user_text)
    job_vec = encode_text(job_text)
    return float(cosine_similarity(user_vec, job_vec))

# Placeholder for when interaction data is available
def ibcf(user_id: str, job_id: str) -> float:
    # Return 0 for now (no data)
    return 0.0

# compute hybrid score
# default weights: tag 60%, semantic 30%, collaborative 10%.
def compute_hybrid_score(user: UserProfile, job: JobBase,
                         tag_score: float,
                         semantic_score: float = 0.0,
                         collab_score: float = 0.0,
                         alpha: float = 0.6,
                         beta: float = 0.3,
                         gamma: float = 0.1) -> float:
    total = alpha * tag_score + beta * semantic_score + gamma * collab_score
    return total
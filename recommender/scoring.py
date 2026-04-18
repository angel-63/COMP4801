from db.models.job import JobBase
from sentence_transformers import SentenceTransformer
import numpy as np
from db.models.user import User

# Stage 2
# computes a relevance score based on tag overlap between user and job
def relevance_score(user: User, job: JobBase) -> float:
    user_skills = {s.skill.lower() for s in user.skill_tags} if user.skill_tags else set()
    job_skills = {s.lower() for s in job.skill_tags} if job.skill_tags else set()
    skill_match = len(user_skills & job_skills)
    
    industry_match = len(set(user.preference_tags.industries) & set(job.company_industry))
    function_match = len(set(user.preference_tags.job_function) & set(job.job_function))
    
    user_roles = set(user.preference_tags.role_category)
    job_roles = {job.role_category} if job.role_category else set()
    role_match = len(user_roles & job_roles)
    
    return skill_match * 10 + role_match * 5 + function_match * 2 + industry_match

# Stage 3
model = SentenceTransformer('all-MiniLM-L6-v2') 

def encode_text(text: str) -> np.ndarray:
    return model.encode(text)

def cosine_similarity(vec1, vec2) -> float:
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def build_user_summary(user: User) -> str:
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
            summary.append(f"{proj.project_name};")
    if user.certificate:
        summary.append("| Certificates: ")
        for cert in user.certificate:
            summary.append(f"{cert.certificate_name} issued by {cert.issuing_organization};")
    return " ".join(summary)

# semantic similarity of job description and the user profile summary 
def semantic_score(user: User, job: JobBase) -> float:
    user_text = build_user_summary(user)
    job_text = f"{job.job_title} {job.job_description}"
    user_vec = encode_text(user_text)
    job_vec = encode_text(job_text)
    return float(cosine_similarity(user_vec, job_vec))

# compute hybrid score
# default weights: tag 70%, semantic 30%
def compute_hybrid_score(user: User, job: JobBase,
                         tag_score: float,
                         semantic_score: float,
                         alpha: float = 0.7,
                         beta: float = 0.3) -> float:
    total = alpha * tag_score + beta * semantic_score
    return total
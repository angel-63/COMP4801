from db.models.job import JobBase
from scraper.tagging import normalise_industry
from sentence_transformers import SentenceTransformer
import numpy as np
from db.models.user import User

# Stage 2
# computes a relevance score based on tag overlap between user and job
def relevance_score(user: User, job: JobBase) -> float:
    user_skills = {s.skill.lower() for s in user.skill_tags} if user.skill_tags else set()
    # Required skills: high weight
    required_set = {s.lower() for s in job.skill_tags}
    required_match = len(user_skills & required_set)
    # Optional skills: low weight
    optional_set = {s.lower() for s in job.optional_skill_tags} if job.optional_skill_tags else set()
    optional_match = len(user_skills & optional_set)
    
    skill_match_weighted = required_match * 5 + optional_match * 1
    user_industry_preference = set().union(*[normalise_industry(ind) for ind in user.preference_tags.industries])
    industry_match = len(user_industry_preference & set(job.company_industry))
    function_match = len(set(user.preference_tags.job_function) & set(job.job_function))
    
    user_roles = set(user.preference_tags.role_category)
    job_roles = {job.role_category} if job.role_category else set()
    role_match = len(user_roles & job_roles)
    
    exp_lv_match = exp_lv_match = int(
        job.experience_level is not None 
        and job.experience_level in (user.preference_tags.experience_level or [])
    )
    
    return skill_match_weighted + role_match * 5 + function_match * 2 + industry_match + exp_lv_match

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
            if proj.description:
                summary.append(f"{proj.project_name} at {proj.project_owner} with deails {proj.description};")
            else:
                summary.append(f"{proj.project_name} at {proj.project_owner};")
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
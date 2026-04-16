import hashlib
import re

from db.models.job import INDUSTIRES_RULES, JOB_FUNCTION_RULES, ROLES_DICTIONARY, SKILLS_RULES

def remove_html_tags(text: str) -> str:
    return re .sub(r'<.*?>', '', text.lower())

'''
def extract_role_category(title: str) -> str:
    text = title.strip().lower()
    for key, category in ROLES_DICTIONARY.items():
        if key in text:
            return category
    return "Other"
'''

def generate_dedup_key(title: str, description: str) -> str:
    t = title.strip().lower()
    d = remove_html_tags(description)
    text = f"{t}|{d}"
    return hashlib.sha256(text.encode()).hexdigest()

INDUSTIRES = [(cateogry, pattern) for cateogry, patterns in INDUSTIRES_RULES.items() for pattern in patterns]
JOB_FUNCTION = [(cateogry, pattern) for cateogry, patterns in JOB_FUNCTION_RULES.items() for pattern in patterns]
SKILLS = [(category, skill) for category, keywords in SKILLS_RULES.items() for skill in keywords]

def normalise_industry(industry: str) -> set[str]:
    tags = set()
    text = industry.lower()
    for category, pattern in INDUSTIRES:
        if re.search(pattern, text):
            tags.add(category)
    if not tags:
        tags.add("Other")
    return tags

def normalise_job_unction(function: str) -> set[str]:
    tags = set()
    text = function.lower()
    for category, pattern in JOB_FUNCTION:
        if re.search(pattern, text):
            tags.add(category)
    if not tags:
        tags.add("Other")
    return tags

def extract_skills(description: str) -> set[str]:
    skills = set()
    text = remove_html_tags(description)
    for category, skill in SKILLS:
        # if re.search(r'\b' + re.escape(skill) + r'\b', text):
        if skill in text:
            skills.add(skill)
    return skills

# def extract_skill_tags(description: str) -> list[str]:
#     text = remove_html_tags(description)
#     found = []
#     for skill in SKILLS:
#         if skill in text:
#             found.append(skill.title())
#     return sorted(set(found))
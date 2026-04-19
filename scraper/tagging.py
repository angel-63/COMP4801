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
    all_skills = set()
    text = remove_html_tags(description)
    required_skills = set()
    optional_skills = set()
    required_patterns = [
        (r"\bproficiency\s+in\b", "before"),
        (r"\bstrong\b", "after"),
        (r"\bproven\b", "after"),
        (r"\bexcellent\b", "after"),
        (r"\bmust\s+have\b", "both"),
        (r"\brequired\b", "before"),
        (r"\bis\s+essential\b", "after"),
        (r"\bexperienced\s+in\b", "before"),
    ]
    optional_patterns = [
        (r"\bknowledge\s+of\b", "before"),
        (r"\bfamiliarity\s+with\b", "before"),
        (r"\bis\s+an?\s+advantage\b", "after"),
        (r"\bnice\s+to\s+have\b", "both"),
        (r"\bpreferred\b", "both"),
        (r"\bis\s+a\s+plus\b", "after"),
        (r"\bbonus\b", "both"),
        (r"\bdesired\b", "both"),
    ]
    
    for category, skill in SKILLS:
        # if re.search(r'\b' + re.escape(skill) + r'\b', text):
        if skill in text:
            all_skills.add(skill)
            
    for skill in all_skills:
        for match in re.finditer(skill, text):
            start = match.start()
            end = match.end()
            before_text = text[max(0, start - 80):start].lower()
            after_text = text[end:min(len(text), end + 80)].lower()

            is_required = False
            is_optional = False

            for pat, direction in required_patterns:
                if direction == "before" and re.search(pat, before_text):
                    is_required = True
                elif direction == "after" and re.search(pat, after_text):
                    is_required = True
                elif direction == "both" and (re.search(pat, before_text) or re.search(pat, after_text)):
                    is_required = True
                if is_required:
                    break

            if not is_required:
                for pat, direction in optional_patterns:
                    if direction == "before" and re.search(pat, before_text):
                        is_optional = True
                    elif direction == "after" and re.search(pat, after_text):
                        is_optional = True
                    elif direction == "both" and (re.search(pat, before_text) or re.search(pat, after_text)):
                        is_optional = True
                    if is_optional:
                        break
        
        if is_required:
            required_skills.add(skill)
        elif is_optional:
            optional_skills.add(skill)
        else:
            # if no cue, treat as optional
            optional_skills.add(skill)
    
    optional_skills -= required_skills
    return sorted(required_skills), sorted(optional_skills)
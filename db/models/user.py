# db schema
from datetime import datetime
from typing import Optional
from db.models import job
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class UserProfile(BaseModel):
    email: EmailStr
    full_name: str
    password: str  # Will be hashed
    phone: str
    location: Optional[str] = None
    links: list[Link] = Field(default_factory=list)
    
    resume_count: int = Field(default=0, ge=0, le=3)
    cover_letter_count: int = Field(default=0, ge=0, le=3)
    
    preference_tags = list[Preference] = Field(default_factory=list)
    
    education = list[Education] = Field(default_factory=list)
    work_experience = list[Experience] = Field(default_factory=list)
    project = list[Project] = Field(default_factory=list)
    skill_tags = list[Skill] = Field(default_factory=list)
    language = list[Language] = Field(default_factory=list)
    certificate = list[Certificate] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = Field(default=True)

class Resume(BaseModel):
    user_id: ObjectId
    filename: str = Field(default="My Resume")
    summary: str
    education: list[Education] = Field(default_factory=list)
    experiences: list[ResumeExperience] = Field(default_factory=list)
    projects: list[ResumeProject] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    file = Optional[bytes] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class Preference(BaseModel):
    job_function: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    employment_type:list[job.EmploymentType] = Field(default_factory=list)
    experience_level: list[job.ExperienceLevel] = Field(default_factory=list)
    job_mode: list[job.JobMode] = Field(default_factory=list)
    min_salary: int
    role_category: list[str] = Field(default_factory=list)
    
class Link(BaseModel):
    site: job.Site
    url: str
    
class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: datetime
    end_date: Optional[datetime] = None

class Experience(BaseModel):
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None

class Skill(BaseModel):
    skill: str
    proficiency: str  # Beginner, Intermediate, Expert

class Language(BaseModel):
    language: str
    proficiency: str  # Beginner, Intermediate, Expert

class Project(BaseModel):
    project_name: str
    project_description: str
    technologies: list[str] = Field(default_factory=list)

class Certificate(BaseModel):
    certificate_name: str
    issuing_organization: str
    issue_date: datetime
    expiration_date: Optional[datetime] = None

class ResumeExperience(BaseModel):
    experience_id = ObjectId
    description = str

class ResumeProject(BaseModel):
    project_id = ObjectId
    description = str

class CoverLetter(BaseModel):
    user_id: ObjectId
    filename: str
    receiver: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ApplicationBase(BaseModel):
    user_id: ObjectId
    job_id: ObjectId
    resume_id: ObjectId
    cover_letter_id: Optional[ObjectId] = None
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="applied")  # applied, viewed, interview, rejected, accepted
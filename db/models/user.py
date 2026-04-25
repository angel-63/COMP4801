# db schema
from __future__ import annotations
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo
from db.models import job
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
    
class Link(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    site: str
    url: str
    
class Education(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    institution: str
    degree: str
    field_of_study: str
    start_date: datetime
    end_date: Optional[datetime] = None

class Experience(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    location: str

class Skill(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    skill: str
    proficiency: Optional[str]=None  # Beginner, Intermediate, Expert

class Language(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    language: str
    proficiency: str  # Beginner, Intermediate, Expert

class Project(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    project_name: str
    project_owner: str
    start_date: datetime
    end_date: Optional[datetime] = None
    location: str
    description: Optional[str] = None

class Certificate(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    certificate_name: str
    issuing_organization: str
    issue_date: datetime
    expiration_date: Optional[datetime] = None

class ResumeExperience(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    experience_id: str
    description: str

class ResumeProject(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    project_id: str
    description: str

class Preference(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    job_function: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    employment_type:list[job.EmploymentType] = Field(default_factory=list)
    experience_level: list[job.ExperienceLevel] = Field(default_factory=list)
    job_mode: list[job.JobMode] = Field(default_factory=list)
    min_salary: int
    role_category: list[str] = Field(default_factory=list)
    
class User(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    email: EmailStr
    first_name: str
    last_name: str
    password: str  # Will be hashed
    phone: str
    location: Optional[str] = None
    links: list[Link] = Field(default_factory=list)
    
    resume_count: int = Field(default=0, ge=0, le=3)
    cover_letter_count: int = Field(default=0, ge=0, le=3)
    
    preference_tags: Preference = Field(default_factory=Preference)
    
    education: list[Education] = Field(default_factory=list)
    work_experience: list[Experience] = Field(default_factory=list)
    project: list[Project] = Field(default_factory=list)
    skill_tags: list[Skill] = Field(default_factory=list)
    language: list[Language] = Field(default_factory=list)
    certificate: list[Certificate] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = Field(default=True)

class Resume(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    user_id: str
    filename: str = Field(default="My Resume")
    summary: str
    education: list[str] = Field(default_factory=list)
    experiences: list[ResumeExperience] = Field(default_factory=list)
    projects: list[ResumeProject] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    file: Optional[bytes] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class CoverLetter(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    user_id: str
    filename: str
    receiver: str
    content: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ApplicationBase(BaseModel):
    id: str = Field(alias="_id", default_factory=ObjectId)
    user_id: str
    job_id: str
    resume_id: str
    cover_letter_id: Optional[str] = None
    applied_at: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="applied")  # applied, viewed, interview, rejected, accepted
# db schema
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from pymongo import ASCENDING, TEXT

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    password: str  # Will be hashed
    resume_count: int = Field(default=0, ge=0, le=3)
    cover_letter_count: int = Field(default=0, ge=0, le=3)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

class ResumeBase(BaseModel):
    user_id: ObjectId = Field(alias="_id")
    title: str = Field(default="My Resume")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_current: bool = Field(default=False)

class Experience(BaseModel):
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: str
    is_current: bool = Field(default=False)

class Skill(BaseModel):
    skill_name: str
    proficiency: Optional[str] = None  # Beginner, Intermediate, Expert

class Project(BaseModel):
    project_name: str
    project_description: str
    technologies: List[str] = Field(default_factory=list)

class Certificate(BaseModel):
    certificate_name: str
    issuing_organization: str
    issue_date: datetime
    expiration_date: Optional[datetime] = None

class ResumeWithDetails(ResumeBase):
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certificates: List[Certificate] = Field(default_factory=list)

class CoverLetterBase(BaseModel):
    user_id: ObjectId = Field(alias="_id")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ApplicationBase(BaseModel):
    user_id: ObjectId = Field(alias="_id")
    job_id: ObjectId = Field(alias="_id")
    resume_id: ObjectId = Field(alias="_id")
    cover_letter_id: Optional[ObjectId] = None
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="applied")  # applied, viewed, interview, rejected, accepted
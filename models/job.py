from datetime import datetime
from enum import Enum
from typing import List, Optional
from zoneinfo import ZoneInfo
from bson import Binary, ObjectId
from pydantic import BaseModel, ConfigDict, Field


class EmploymentType(Enum):
    FULL_TIME = "fulltime"
    PART_TIME = ("parttime")
    CONTRACT = ("contract", "contractor")
    TEMPORARY = ("temporary")
    INTERNSHIP = ("internship", "summer")
    OTHER = ("other")
    
    @classmethod
    def from_linkedin(cls, value: str) -> "EmploymentType":
        mapping = {
            "Full-time":   cls.FULL_TIME,
            "Part-time":   cls.PART_TIME,
            "Contract":    cls.CONTRACT,
            "Internship":  cls.INTERNSHIP,
            "Other": cls.OTHER,
        }
        return mapping.get(value.strip(), cls.OTHER)

class JobMode(Enum):
    ONSITE = ("on-site")
    REMOTE = ("remote")
    HYBRID = ("hybrid")
    
class ExperienceLevel(Enum):
    INTERNSHIP = ("internship")
    ENTRY = ("entry level")
    ASSOCIATE = ("associate")
    MID_SENIOR = ("mid-senior level")
    DIRECTOR = ("director")
    OTHER = ("other")
    
    @classmethod
    def from_linkedin(cls, value: str) -> "EmploymentType":
        mapping = {
            "Internship":   cls.INTERNSHIP,
            "Entry level":   cls.ENTRY,
            "Associate":    cls.ASSOCIATE,
            "Mid-Senior level":  cls.MID_SENIOR,
            "Director": cls.DIRECTOR,
        }
        return mapping.get(value.strip(), cls.OTHER)
    
class Site(Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"    
    
class JobBase(BaseModel):
    # job_id: ObjectId = Field(alias="_id")
    job_title: str
    company_name: str
    company_logo: Optional[Binary] = None
    company_industry: Optional[List[str]] = Field(None)
    location: Optional[str] = Field(None, examples=["Hong Kong", "Remote (HK)"])
    experience_level: ExperienceLevel
    job_function: Optional[List[str]] = Field(None)
    employment_type: EmploymentType
    job_mode: JobMode
    job_description: str
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    posted_at: datetime
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=ZoneInfo('Asia/Hong_Kong')))
    application_url: str
    original_source_site: Site 
    original_post_id: Optional[str] = None  # for getting the original source url
    skill_tags: Optional[List[str]] = Field(None)
    # role_category: str
    dedup_key: str
    
    model_config = ConfigDict(
        populate_by_name=True,
        use_enum_values=True,
        extra="forbid",
        str_strip_whitespace=True,
        arbitrary_types_allowed=True  # for ObjectId
    )

class ScraperInput(BaseModel):
    site_type: list[Site]
    search_term: str | None = None
    # google_search_term: str | None = None

    location: str = "Hong Kong" # optional
    geoId: int = 103291313 # Hong Kong SAR
    employment_type: Optional[EmploymentType] = None
    job_mode: JobMode
    experience_lv: Optional[ExperienceLevel] = None
    is_easy_apply: bool
    # description_format: DescriptionFormat | None = DescriptionFormat.MARKDOWN

    request_timeout: int = 60
    offset: int | None = 0
    results_wanted: int = 1000
    hours_old: int = 24
    
    
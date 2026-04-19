from datetime import datetime
from enum import Enum
from typing import Optional
from zoneinfo import ZoneInfo
from bson import Binary, ObjectId
from pydantic import BaseModel, ConfigDict, Field


class EmploymentType(Enum):
    FULL_TIME = "fulltime"
    PART_TIME = ("parttime")
    CONTRACT = ("contract")
    TEMPORARY = ("temporary")
    INTERNSHIP = ("internship")
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
    
    @classmethod
    def from_Jobsdb(cls, value: str) -> "EmploymentType":
        mapping = {
            "Full time":   cls.FULL_TIME,
            "Part time":   cls.PART_TIME,
            "Contract/Temp":    cls.CONTRACT,
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
    JOBSDB = "jobsdb"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"    
    
class JobBase(BaseModel):
    job_title: str
    company_name: str
    company_logo: Optional[Binary] = None
    company_industry: Optional[list[str]] = Field(default_factory=list)
    location: Optional[str] = Field(None, examples=["Hong Kong", "Remote (HK)"])
    experience_level: ExperienceLevel
    job_function: list[str] = Field(default_factory=list)
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
    skill_tags: list[str] = Field(default_factory=list)
    optional_skill_tags: list[str] = Field(default_factory=list)
    role_category: Optional[str] = None
    dedup_key: str
    
    model_config = ConfigDict(
        populate_by_name=True,
        use_enum_values=True,
        extra="forbid",
        str_strip_whitespace=True,
        arbitrary_types_allowed=True
    )

class JobJobsdb(JobBase):
    experience_level: Optional[ExperienceLevel] = None
    
class Job(JobBase):
    id: ObjectId = Field(alias="_id")
    experience_level: Optional[ExperienceLevel] = None
    
    model_config = ConfigDict(
        populate_by_name=False,
        use_enum_values=False,
        extra="forbid",
        str_strip_whitespace=True,
        arbitrary_types_allowed=True
    )


# class JobLinkedIn(JobBase):
#     experience_level: ExperienceLevel

class ScraperInput(BaseModel):
    site_type: Site
    search_term: str | None = None
    # google_search_term: str | None = None

    location: str = "Hong Kong" # optional
    geoId: int = 103291313 # Hong Kong SAR
    employment_type: Optional[EmploymentType] = None
    job_mode: JobMode
    experience_lv: Optional[ExperienceLevel] = None
    role_category: Optional[str] = None
    is_easy_apply: bool
    # description_format: DescriptionFormat | None = DescriptionFormat.MARKDOWN

    request_timeout: int = 60
    offset: int | None = 0
    results_wanted: int = 1000
    hours_old: int = 24
    
INDUSTIRES_RULES = {
    'Venture Capital & Private Equity': [
        r'\bventure\s+capital\b',
        r'\bprivate\s+equity\b',
    ],
    'Investment Banking': [
        r'\binvestment\s+banking\b',
    ],
    'Banking': [
        r'(?!investment\s+)\bbanking\b',
    ],
    'Investment Management': [
        r'\binvestment\s+management\b',
    ],
    'Capital Markets': [
        r'\bcapital\s+markets\b',
        r'\bsecurities\s+and\s+commodity\s+exchanges\b',
        r'\bsecurities\s+&\s+commodity\s+exchanges\b',
    ],
    'Robotics': [
        r'\brobotics\b',
    ],
    'Gaming': [
        r'\bgaming\b',
    ],
    'Software Development': [
        r'\bsoftware\s+development\b',
    ],
    'IT Services & Consulting': [
        r'\bit\s+services\b',
        r'\bit\s+consulting\b',
    ],
    'Technology': [
        r'\btechnology,\s+information\s+and\s+internet\b',
        r'\btechnology,\s+information\s+and\s+media\b',
        r'\btechnology\b',
    ],
    'Hardware Manufacturing': [
        r'\bcomputers\s+and\s+electronics\s+manufacturing\b',
        r'\bsemiconductor\s+manufacturing\b',
        r'\bcomputer\s+hardware\s+manufacturing\b',
    ],
    'Telecommunications': [
        r'\btelecommunications\b',
    ],
    'Internet & Digital Platforms': [
        r'\binternet\s+marketplace\s+platforms\b',
        r'\binternet\s+publishing\b',
        r'\bblockchain\b',
    ],
    'Media & Entertainment': [
        r'\bbroadcast\s+media\b',
        r'\bmedia\s+production\b',
        r'\bpublishing\b',
        r'\bnewspaper\s+publishing\b',
    ],
    'Retail Luxury Goods': [
        r'\bretail\s+luxury\s+goods\b',
        r'\bjewelry\b',
    ],
    'Retail': [
        r'\bretail\s+apparel\s+and\s+fashion\b',
        r'\bretail\b',
        r'\bapparel\s+&\s+fashion\b',
    ],
    'Consumer Goods': [
        r'\bcosmetics\b',
        r'\bpersonal\s+care\s+product\s+manufacturing\b',
    ],
    'Food & Beverage': [
        r'\bfood\s+and\s+beverage\b',
        r'\bfood\s+&\s+beverage\b',
        r'\bbeverage\s+manufacturing\b',
        # r'\btobacco\s+manufacturing\b',
    ],
    'Aerospace & Aviation': [
        r'\bairlines\s+and\s+aviation\b',
        # r'\baviation\s+and\s+aerospace\s+component\s+manufacturing\b',
    ],
    'Automotive': [
        r'\bmotor\s+vehicle\s+manufacturing\b',
        r'\btruck\s+transportation\b',
    ],
    'Transportation & Logistics': [
        r'\brail\s+transportation\b',
        r'\btransportation,\s+logistics,\s+supply\s+chain\b',
    ],
    'Manufacturing': [
        r'\bmanufacturing\b'
        # r'\bautomation\s+machinery\s+manufacturing\b',
        # r'\bindustrial\s+machinery\s+manufacturing\b',
        # r'\bchemical\s+manufacturing\b',
        # r'\bappliances,\s+electrical,\s+and\s+electronics\s+manufacturing\b',
        # r'\bfurniture\s+and\s+home\s+furnishings\s+manufacturing\b',
    ],
    'Construction': [
        r'\bconstruction\b',
        r'\bbuilding\s+construction\b',
        r'\bcivil\s+engineering,\s+architecture\s+and\s+planning\b',
    ],
    'Real Estate': [
        r'\breal\s+estate\b',
    ],
    'Pharmaceuticals & Biotech': [
        r'\bpharmaceutical\s+manufacturing\b',
        r'\bbiotechnology\s+research\b',
    ],
    'Healthcare Services': [
        r'\bhospitals\s+and\s+health\s+care\b',
        r'\bmedical\b'
        # r'\bmedical\s+practices\b',
    ],
    # 'Medical Equipment': [
    #     r'\bmedical\s+equipment\s+manufacturing\b',
    # ],
    'Business Consulting': [
        r'\bbusiness\s+consulting\s+and\s+services\b',
        r'\bstrategic\s+management\s+services\b',
    ],
    'Legal Services': [
        r'\blaw\s+practice\b',
        r'\blegal\s+services\b',
    ],
    'Human Resources & Staffing': [
        r'\bhuman\s+resources\s+services\b',
        r'\bstaffing\s+and\s+recruiting\b',
    ],
    'Marketing & Advertising': [
        r'\badvertising\s+services\b',
        r'\bmarketing\s+services\b',
        r'\bpublic\s+relations\b',
    ],
    'Research Services': [
        r'\bresearch\s+services\b',
    ],
    'Design & Creative': [
        r'\binterior\s+design\b',
    ],
    'Events Services': [
        r'\bevents\s+services\b',
    ],
    'Education': [
        r'\beducation\b',
        r'\bhigher\s+education\b',
        r'\bprimary\s+and\s+secondary\s+education\b',
        r'\beducation\s+administration\s+programs\b',
    ],
    'Non‑profit & Philanthropy': [
        r'\bnon-profit\b',
        r'\bphilanthropic\s+fundraising\b',
        r'\bcivic\s+and\s+social\s+organizations\b',
    ],
    'Government & Public Administration': [
        r'\bgovernment\s+administration\b',
        r'\bgovernment\s+relations\b',
        r'\blegislative\s+offices\b',
    ],
    'Utilities': [
        r'\butilities\b',
        r'\brenewable\s+energy\b',
    ],
    'Environmental Services': [
        r'\benvironmental\s+services\b',
    ],
    'Hospitality': [
        r'\bhospitality\b',
    ],
    'Travel & Tourism': [
        r'\btravel\s+arrangements\b',
        r'\bairlines\b',
    ],
    'Insurance': [
        r'\binsurance\b',
        # r'\binsurance\s+agencies\s+and\s+brokerages\b',
    ],
    'Accounting': [
        r'\baccounting\b',
    ],
    'Financial Services': [
        r'\bfinancial\s+services\b',
    ],
}

JOB_FUNCTION_RULES = {
    "Accounting": [r'\baccounting\b', r'\bauditing\b'],
    "Administrative": [r'\badministrative\b', r'\badministration\b'],
    "Arts and Design": [r'\barts?\b', r'\bdesign\b', r'\bcreative\b'],
    "Business Development": [r'\bbusiness\s+development\b', r'\bbd\b'],
    "Community and Social Services": [r'\bvolunteer\b'],
    "Consulting": [r'\bconsulting\b', r'\bconsultant\b'],
    "Education": [r'\beducation\b', r'\btraining\b'],
    "Engineering": [r'\bengineering\b', r'\bengineer\b'],
    "Entrepreneurship": [r'\bentrepreneurship\b'],
    "Finance": [r'\bfinance\b', r'\bfinancial\b'],
    "General Business": [r'\bgeneral\b'],
    "Healthcare Services": [r'\bhealthcare\b', r'\bmedical\b'],
    "Human Resources": [r'\bhuman\s+resources\b', r'\bhr\b'],
    "Information Technology": [r'\binformation\s+technology\b', r'\bit\b', r'\bsoftware\b', r'\bprogramming\b'],
    "Legal": [r'\blegal\b', r'\blaw\b'],
    # "Management": [r'\bmanagement\b', r'\bmanager\b'],
    "Manufacturing": [r'\bmanufacturing\b', r'\bproduction\b'],
    "Marketing": [r'\bmarketing\b'],
    "Media and Communication": [r'\bmedia\b', r'\bcommunication\b', r'\bpublic\s+relations\b', r'\bwriting\b', r'\bediting\b'],
    "Military and Protective Services": [r'\bmilitary\b', r'\bprotective\b', r'\bsecurity\b', r'\bgovernment\b'],
    "Operations": [r'\boperations\b', r'\bsupply\s+chain\b', r'\blogistics\b'],
    "Product Management": [r'\bproduct\s+management\b'],
    "Program and Project Management": [r'\bproject\s+management\b', r'\bprogram\s+management\b'],
    "Purchasing": [r'\bpurchasing\b', r'\bprocurement\b', r'\bbuyer\b'],
    "Quality Assurance": [r'\bquality\s+assurance\b', r'\bqa\b'],
    "Real Estate": [r'\breal\s+estate\b'],
    "Research": [r'\bresearch\b', r'\bscience\b'],
    "Sales": [r'\bsales\b'],
    "Support": [r'\bsupport\b', r'\bcustomer\s+service\b', r'\bcall\s+centre\b'],
}

ROLES_DICTIONARY = {
    "Accounting": [
        "Accountant", "Tax Specialist", "Payroll Specialist", "Auditor"
    ],
    "Administrative": [
        "Admin Officer", "Data Entry Specialist", "Clerk", "Administrator"
    ],
    "Arts and Design": [
        "Artist", "Designer", "Host", "Actor", "Architect"
    ],
    "Business Development": [
        "Managing Director", "Business Development Manager", "Merger and Acquisitions Specialist", "Chief Executive Officer", "Chief Marketing Officer"
    ],
    "Community and Social Services": [
        "Social Worker", "Counsellor", "Psychologist", "Volunteer"
    ],
    "Consulting": [
        "Consultant", "Sales Consultant", "CRM Consultant"
    ],
    "Education": [
        "Professor", "Primary School Teacher", "Secondary School Teacher", "Teaching Assistant", "Instructor", 
        "Coach"
    ],
    "Engineering": [
        "Aeronautical Engineer", "Software Developer", "Petroleum Drilling Engineer", "Software Engineer", "Coding Engineer"
    ],
    "Entrepreneurship": [
        "Founder", "Board Member", "Partner", "Owner"
    ],
    "Finance": [
        "Corporate Finance Specialist", "Investment Manager", "Risk Manager", "Insurance Specialist", "Fund Manager", "Commercial Banker", "Investor", "Loan Officer", "Compliance Officer"
    ],
    "Healthcare Services": [
        "Doctor", "Nurse", "Dentist", "Healthcare Technician", "Orthopaedist", "Healthcare Assistant", "Healthcare Administrator"
    ],
    "Human Resources": [
        "Recruiter", "Staffing Specialist", "Compensation and Benefits Administrator", "Employee Wellness Manager", "Organisational Development Specialist", "Internal Corporate Trainer"
    ],
    "Information Technology": [
        "Chief Information Officer", "Database Developer", "IT Auditor", "SAP Consultant", "Telecommunications Manager"
    ],
    "Legal": [
        "Attorney", "Paralegal", "Judiciary"
    ],
    "Marketing": [
        "Advertising Specialist", "Branding Specialist", "Customer Insights Specialist", "Marketing Analytics Specialist"
    ],
    "Media and Communication": [
        "Technical Writer", "Journalist", "Mass Media Professional", "Website Manager"
    ],
    "Military and Protective Services": [
        "Firefighter", "Police Officer", "Airport Security Officer", "Investigator"
    ],
    "Operations": [
        "Site Operations Manager", "Marketing Operations Specialist", "IT Operations Manager", "IT Infrastructure Manager", "Infrastructure Maintenance Specialist"
    ],
    "Product Management": [
        "Product Manager"
    ],
    "Program and Project Management": [
        "Project Manager", "Program Manager", "Project Administrator", "Business Process Manager", "Agile Consultant"
    ],
    "Purchasing": [
        "Procurement Specialist", "Purchasing Specialist"
    ],
    "Quality Assurance": [
        "Business Analyst", "Healthcare QA Specialist", "Tester", "Software Tester", "Penetration Testing Engineer"
    ],
    "Real Estate": [
        "Real Estate Broker", "Real Estate Asset Manager", "Property Manager"
    ],
    "Research": [
        "Chemist", "Healthcare Researcher", "Research Analyst", "Product Manager", "Data Scientist"
    ],
    "Sales": [
        "Enterprise Sales Specialist", "Field Sales Specialist"
    ],
    "Support": [
        "Customer Service Specialist", "Call Centre Manager", "Support Representative"
    ]
}

SKILLS_RULES = {
    "Accounting": {
        "accounting software", "quickbooks", "sage", "excel", "financial reporting",
        "general ledger", "accounts payable", "accounts receivable", "tax preparation",
        "auditing", "financial analysis", "gaap", "tax software", "bookkeeping"
    },
    "Administrative": {
        "microsoft office", "excel", "word", "outlook", "powerpoint", "data entry",
        "scheduling", "calendar management", "travel arrangements", "office management",
        "document management", "customer service", "filing", "record keeping"
    },
    "Arts and Design": {
        "adobe creative suite", "photoshop", "illustrator", "indesign", "after effects",
        "sketch", "figma", "3d modeling", "autocad", "rhino", "blender", "maya",
        "typography", "color theory", "ui design", "ux design", "illustration",
        "motion graphics", "video editing"
    },
    "Business Development": {
        "crm software", "salesforce", "hubspot", "market analysis", "lead generation",
        "negotiation", "strategic planning", "partnership development", "pipeline management",
        "competitive analysis", "business strategy", "financial modeling"
    },
    "Community and Social Services": {
        "case management", "crisis intervention", "counseling techniques", "mental health first aid",
        "social work assessment", "community outreach", "referral coordination", r'\bcpr\b', "first aid",
        "client records management", "medicaid/medicare", "advocacy"
    },
    "Consulting": {
        "data analysis", "process improvement", r'\blean\b', "six sigma", "change management",
        "business process modeling", "stakeholder management", "strategy consulting",
        "financial analysis", "presentation skills", "power bi", "tableau"
    },
    "Education": {
        "curriculum development", "lesson planning", "classroom management", "educational technology",
        "google classroom", "microsoft teams", "zoom", "learning management systems",
        "student assessment", "differentiated instruction", "special education"
    },
    "Engineering": {
        r'\bcad\b', "autocad", "solidworks", "catia", "matlab", "python", "c++", "java",
        "simulation software", "finite element analysis", "circuit design", "embedded systems",
        "robotics", "plc programming", "mechanical design", "process engineering"
    },
    "Entrepreneurship": {
        "business planning", "financial forecasting", "fundraising", "investor relations",
        "pitch deck creation", "market research", "strategic management", "product development",
        "lean startup", "agile", "venture capital", "budgeting"
    },
    "Finance": {
        "financial modeling", "excel", "vba", "SQL", "python", "risk management", "investment analysis",
        "portfolio management", "corporate finance", "financial reporting", "bloomberg terminal",
        "valuation", "derivatives", "capital markets", "regulatory compliance"
    },
    "Healthcare Services": {
        "electronic health records", "epic", "cerner", "medical terminology", "patient assessment",
        "diagnostic procedures", "ehr", "vital signs", "phlebotomy", "medication administration",
        r'\bcpr\b', r'\bacls\b', "icd-10", "cpt coding", "clinical documentation"
    },
    "Human Resources": {
        "hr information systems", "workday", "sap hr", "recruitment", "talent acquisition",
        "onboarding", "employee relations", "performance management", "compensation analysis",
        "benefits administration", "labor law", "payroll", "training development"
    },
    "Information Technology": {
        "python", "java", "javascript", "SQL", "AWS", "azure", r'\bc\b', "c++", "gcp", "linux", "unix", 
        "networking", "cybersecurity", "docker", "kubernetes", "CI/CD", r'\bgit\b', "agile",
        "scrum", "itil", "devops", "database administration", "cloud computing",
        "machine learning", "deep learning", "tensorflow", "pytorch", "windows server",
        "scikit-learn", "keras", "nlp", "computer vision", "data science", "pandas",
        "numpy", "big data", "spark", "pyspark", "hadoop", "LLM", "generative ai", "ai governance"
    },
    "Legal": {
        "legal research", "westlaw", "lexisnexis", "contract drafting", "corporate law",
        "litigation", "compliance", "intellectual property", "regulatory affairs",
        "document review", "case management software", "negotiation"
    },
    "Marketing": {
        "google analytics", r'\bseo\b', r'\bsem\b', "social media marketing", "content management systems",
        "wordpress", "email marketing", "marketing automation", "hubspot", "market research",
        r'\bcrm\b', "data analysis", "adobe analytics", "a/b testing"
    },
    "Media and Communication": {
        "adobe creative suite", "premiere pro", "final cut pro", "pro tools", "wordpress",
        "content management", "copywriting", "journalism", "storytelling", "social media strategy",
        r'\bSEO\b', "video production", "audio editing"
    },
    "Military and Protective Services": {
        "firearms training", "emergency response", r'\bcpr\b', "first aid", "physical fitness",
        "crisis management", "investigation techniques", "surveillance", "security protocols",
        "risk assessment", "defensive tactics"
    },
    "Operations": {
        "supply chain management", "logistics", "inventory management", "erp systems", r'\bsap\b',
        "oracle", "lean manufacturing", "six sigma", "process optimization", "demand planning",
        "warehouse management", "data analysis", "power bi"
    },
    "Product Management": {
        "product lifecycle management", "agile", "scrum", "jira", "confluence", "roadmap planning",
        "user stories", "market analysis", "competitive analysis", "user research", "ux design",
        "data analysis", "a/b testing"
    },
    "Program and Project Management": {
        "project management software", "microsoft project", "jira", "asana", "trello", "agile",
        "scrum", "waterfall", "risk management", "budget management", "stakeholder management",
        "pmp certification", "prince2", "critical path method"
    },
    "Purchasing": {
        "strategic sourcing", "supplier management", "negotiation", "procurement software",
        "sap mm", "coupa", "contract management", "purchase orders", "inventory management",
        "supply chain", "cost reduction", "vendor evaluation"
    },
    "Quality Assurance": {
        "test automation", "selenium", "junit", "testng", "manual testing", "bug tracking",
        "jira", "testrail", "QA methodologies", "agile", "performance testing", "security testing",
        "SQL", "python", "CI/CD", "quality management systems", "iso 9001"
    },
    "Real Estate": {
        "property management software", "yardi", "MRI", "real estate law", "financial analysis",
        "valuation", "market analysis", "property valuation", "leasing", "contract negotiation",
        "crm", "real estate investment"
    },
    "Research": {
        "research methodology", "statistical analysis", "spss", r'\br\b', "python", "sas", "data collection",
        "experimental design", "literature review", "grant writing", "laboratory techniques",
        "clinical research", "qualitative analysis", "quantitative analysis"
    },
    "Sales": {
        "crm software", "salesforce", "hubspot", "cold calling", "lead generation", "negotiation",
        "account management", "sales pipeline", "forecasting", "solution selling", "product demo",
        "closing skills"
    },
    "Support": {
        "help desk software", "zendesk", "freshdesk", "service now", "ticketing system",
        "remote support", "troubleshooting", "technical support", "customer service",
        "live chat", "email support", "phone support", r'\bitil\b'
    }
}
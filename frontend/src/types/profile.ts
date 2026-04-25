export type Education = {
  id?: string
  institution?: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
}

export type WorkExperience = {
  id?: string
  company?: string
  position?: string
  location?: string
  startDate?: string
  endDate?: string
}

export type Project = {
  id?: string
  projectName?: string
  projectOwner?: string
  startDate?: string
  endDate?: string
  location?: string
  description?: string
  technologies?: string[]
}

export type Skill = {
  id?: string
  skill?: string
  proficiency?: string
}

export type Preference = {
  id?: string
  jobFunction?: string[]
  industries?: string[]
  employmentType?: string[]
  experienceLevel?: string[]
  jobMode?: string[]
  minSalary?: number
  roleCategory?: string[]
}

export type Language = {
  id?: string
  language?: string
  proficiency?: string
}

export type Certificate = {
  id?: string
  name?: string
  issuingOrg?: string
  issueDate?: string
  expirationDate?: string
}

export type ProfileLink = {
  id?: string
  site?: string
  url?: string
}

export type UserProfile = {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  phone?: string
  location?: string
  resumeCount?: number
  coverLetterCount?: number
  education?: Education[]
  workExperience?: WorkExperience[]
  projects?: Project[]
  skills?: Skill[]
  languages?: Language[]
  certificates?: Certificate[]
  preferences?: Preference
  links?: ProfileLink[]
}

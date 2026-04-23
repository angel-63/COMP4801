export type JobSummary = {
  id: string
  jobTitle?: string
  companyName?: string
  companyLogoDataUrl?: string
  companyIndustry?: string[]
  experienceLevel?: string
  jobFunction?: string[]
  employmentType?: string
  jobMode?: string
  jobDescription?: string
  minSalary?: number
  maxSalary?: number
  postedAt?: string
  createdAt?: string
  expiresAt?: string
  applicationUrl?: string
  originalSourceSite?: string
  skillTags?: string[]
}

export type JobsResponse = {
  content: JobSummary[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

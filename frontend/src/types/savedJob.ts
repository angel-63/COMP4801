export type SavedJob = {
  id: string
  title: string
  companyName: string
  employmentType: string
  jobMode: string
  experienceLevel: string
  description: string
  tags: string[]
  companyLogoDataUrl?: string
  applicationUrl?: string
  originalSourceSite?: string
  postedAt?: string
  createdAt?: string
  savedAt: string
  source: 'jobs' | 'matches'
}

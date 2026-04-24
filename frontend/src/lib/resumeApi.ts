import { getCurrentUserId } from './profileApi'
import { authFetch } from './authApi'

export type ResumeSectionTitles = {
  personalDetails: string
  professionalSummary: string
  educations: string
  skills: string
  professionalExperiences: string
  projectExperiences: string
  certificates: string
  languages: string
}

export type ResumeLinkItem = {
  label: string
  url: string
}

export type ResumeEducationItem = {
  institution: string
  degree: string
  startDate: string
  endDate: string
  fieldOfStudy: string
  description: string
}

export type ResumeSkillItem = {
  name: string
  proficiency: string
}

export type ResumeContentItem = {
  title: string
  employer: string
  startDate: string
  endDate: string
  location: string
  description: string
}

export type ResumeLanguageItem = {
  language: string
  proficiency: string
}

export type ResumeTargetJob = {
  jobId?: string
  jobTitle: string
  companyName: string
  employmentType: string
  jobMode: string
  experienceLevel: string
  jobDescription: string
  applicationUrl: string
  skillTags: string[]
}

export type ResumeDocument = {
  id?: string
  userId?: string
  filename: string
  profileName: string
  phone: string
  location: string
  links: ResumeLinkItem[]
  summary: string
  education: ResumeEducationItem[]
  skills: ResumeSkillItem[]
  experiences: ResumeContentItem[]
  projects: ResumeContentItem[]
  certificates: string[]
  languages: ResumeLanguageItem[]
  sectionTitles: ResumeSectionTitles
  targetJob?: ResumeTargetJob
  createdAt?: string
  updatedAt?: string
}

export async function fetchResumeDocument(resumeId: string) {
  const userId = getCurrentUserId()
  const response = await authFetch(`/api/resumes/${encodeURIComponent(resumeId)}?userId=${encodeURIComponent(userId)}`)

  if (!response.ok) {
    throw new Error(`Failed to load resume: ${response.status}`)
  }

  return (await response.json()) as ResumeDocument
}

export async function listResumeDocuments() {
  const userId = getCurrentUserId()
  const response = await authFetch(`/api/resumes?userId=${encodeURIComponent(userId)}`)

  if (!response.ok) {
    throw new Error(`Failed to load resumes: ${response.status}`)
  }

  const payload = await response.json()
  return Array.isArray(payload) ? (payload as ResumeDocument[]) : []
}

export async function saveResumeDocument(resumeId: string, resume: ResumeDocument) {
  const userId = getCurrentUserId()
  const response = await authFetch(`/api/resumes/${encodeURIComponent(resumeId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resume),
  })

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      const errorPayload = (await response.json()) as { message?: string; error?: string }
      throw new Error(errorPayload.message || errorPayload.error || `Failed to save resume: ${response.status}`)
    }

    throw new Error(`Failed to save resume: ${response.status}`)
  }

  return (await response.json()) as ResumeDocument
}

export async function deleteResumeDocument(resumeId: string) {
  const userId = getCurrentUserId()
  const response = await authFetch(`/api/resumes/${encodeURIComponent(resumeId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      const errorPayload = (await response.json()) as { message?: string; error?: string }
      throw new Error(errorPayload.message || errorPayload.error || `Failed to delete resume: ${response.status}`)
    }

    throw new Error(`Failed to delete resume: ${response.status}`)
  }
}

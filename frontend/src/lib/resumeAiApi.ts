import type { ResumeDocument, ResumeTargetJob } from './resumeApi'
import { authFetch } from './authApi'

export type ResumeAiReviewResponse = {
  overallAssessment: string
  strengths: string[]
  improvements: string[]
  priorityChanges: string[]
  tailoredSummary: string
}

export type ResumeAiImproveResponse = {
  improvedText: string
  notes: string[]
}

type ResumeAiPayload = {
  resume: {
    resumeName: string
    profileName: string
    phone: string
    location: string
    links: { label: string; url: string }[]
    summary: string
    education: {
      institution: string
      degree: string
      startDate: string
      endDate: string
      fieldOfStudy: string
      description: string
    }[]
    skills: {
      name: string
      proficiency: string
    }[]
    experiences: {
      title: string
      employer: string
      startDate: string
      endDate: string
      location: string
      description: string
    }[]
    projects: {
      title: string
      employer: string
      startDate: string
      endDate: string
      location: string
      description: string
    }[]
    certificates: string[]
    languages: {
      language: string
      proficiency: string
    }[]
  }
  targetJob: ResumeTargetJob
  sectionType?: string
  currentText?: string
  itemTitle?: string
  itemSubtitle?: string
}

function buildAiPayload(resume: ResumeDocument, extra?: Partial<ResumeAiPayload>): ResumeAiPayload {
  if (!resume.targetJob) {
    throw new Error('Please create this resume from a specific job or match first so AI knows what to optimize for.')
  }

  return {
    resume: {
      resumeName: resume.filename,
      profileName: resume.profileName,
      phone: resume.phone,
      location: resume.location,
      links: resume.links,
      summary: resume.summary,
      education: resume.education,
      skills: resume.skills,
      experiences: resume.experiences,
      projects: resume.projects,
      certificates: resume.certificates,
      languages: resume.languages,
    },
    targetJob: resume.targetJob,
    ...extra,
  }
}

export async function reviewResumeWithAi(resume: ResumeDocument) {
  const response = await authFetch('/api/ai/resume/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildAiPayload(resume)),
  })

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string; error?: string }
      throw new Error(payload.message || payload.error || 'AI review failed.')
    }
    throw new Error('AI review failed.')
  }

  return (await response.json()) as ResumeAiReviewResponse
}

export async function improveResumeTextWithAi(
  resume: ResumeDocument,
  input: {
    sectionType: string
    currentText: string
    itemTitle?: string
    itemSubtitle?: string
  },
) {
  const response = await authFetch('/api/ai/resume/improve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildAiPayload(resume, {
        sectionType: input.sectionType,
        currentText: input.currentText,
        itemTitle: input.itemTitle,
        itemSubtitle: input.itemSubtitle,
      }),
    ),
  })

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string; error?: string }
      throw new Error(payload.message || payload.error || 'AI improvement failed.')
    }
    throw new Error('AI improvement failed.')
  }

  return (await response.json()) as ResumeAiImproveResponse
}

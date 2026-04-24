import type { ResumeTargetJob } from './resumeApi'
import { authFetch } from './authApi'

export type CoverLetterAiReviewResponse = {
  overallAssessment: string
  strengths: string[]
  improvements: string[]
  priorityChanges: string[]
  suggestedLetterBody: string
}

export type CoverLetterAiImproveResponse = {
  improvedText: string
  notes: string[]
}

export type CoverLetterAiDocument = {
  coverLetterName: string
  profileName: string
  phone: string
  location: string
  links: { label: string; url: string }[]
  companyName: string
  hiringManagerName: string
  letterBody: string
  targetJob?: ResumeTargetJob
}

function buildAiPayload(coverLetter: CoverLetterAiDocument, extra?: Record<string, unknown>) {
  if (!coverLetter.targetJob) {
    throw new Error('Please create this cover letter from a specific job or match first so AI knows what to optimize for.')
  }

  return {
    coverLetter: {
      coverLetterName: coverLetter.coverLetterName,
      profileName: coverLetter.profileName,
      phone: coverLetter.phone,
      location: coverLetter.location,
      links: coverLetter.links,
      companyName: coverLetter.companyName,
      hiringManagerName: coverLetter.hiringManagerName,
      letterBody: coverLetter.letterBody,
    },
    targetJob: coverLetter.targetJob,
    ...extra,
  }
}

export async function reviewCoverLetterWithAi(coverLetter: CoverLetterAiDocument) {
  const response = await authFetch('/api/ai/cover-letter/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildAiPayload(coverLetter)),
  })

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string; error?: string }
      throw new Error(payload.message || payload.error || 'AI review failed.')
    }
    throw new Error('AI review failed.')
  }

  return (await response.json()) as CoverLetterAiReviewResponse
}

export async function improveCoverLetterTextWithAi(
  coverLetter: CoverLetterAiDocument,
  input: {
    sectionType: string
    currentText: string
    itemTitle?: string
    itemSubtitle?: string
  },
) {
  const response = await authFetch('/api/ai/cover-letter/improve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildAiPayload(coverLetter, {
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

  return (await response.json()) as CoverLetterAiImproveResponse
}

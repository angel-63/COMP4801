import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, FileText, Trash2 } from 'lucide-react'
import { authFetch } from '../../lib/authApi'
import {
  deleteResumeDocument,
  fetchResumeDocument,
  listResumeDocuments,
  saveResumeDocument,
  type ResumeDocument,
} from '../../lib/resumeApi'
import { getCurrentUserId } from '../../lib/profileApi'

type ResumeItem = {
  id: number
  name: string
  updatedAt: string
}

type CoverLetterItem = {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

type TabType = 'resume' | 'cover-letter'

const MAX_DOCUMENTS_PER_TYPE = 3
const APPLICATION_PREP_STORAGE_KEY = 'jobs:applicationPrep'
const DEFAULT_PREVIEW_NAME = 'Your Name'
const DEFAULT_SECTION_TITLES = {
  personalDetails: 'Personal Details',
  professionalSummary: 'Professional Summary',
  educations: 'Educations',
  skills: 'Skills',
  professionalExperiences: 'Professional Experiences',
  projectExperiences: 'Project Experiences',
  certificates: 'Certificates',
  languages: 'Languages',
} as const

const defaultResumeData: ResumeItem[] = []

const defaultCoverLetterData: CoverLetterItem[] = []

function getResumesStorageKey() {
  return `documents:resumes:${getCurrentUserId()}`
}

function getCoverLettersStorageKey() {
  return `documents:coverLetters:${getCurrentUserId()}`
}

function getResumePrepStorageKey(resumeId: number) {
  return `documents:resumePrep:${getCurrentUserId()}:${resumeId}`
}

function getCoverLetterPrepStorageKey(coverLetterId: number) {
  return `documents:coverLetterPrep:${getCurrentUserId()}:${coverLetterId}`
}

function readStoredItems<T>(storageKey: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback

  const rawValue = window.localStorage.getItem(storageKey)
  if (!rawValue) return fallback

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatStoredTimestamp(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatTimestamp(date)
}

function mapResumeDocumentToItem(document: ResumeDocument): ResumeItem | null {
  const id = Number(document.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    name: document.filename?.trim() || 'Resume',
    updatedAt: formatStoredTimestamp(document.updatedAt) || formatTimestamp(),
  }
}

function getNextDocumentName(items: { name: string }[], baseName: string) {
  let candidateNumber = items.length + 1
  let candidate = `${baseName} ${candidateNumber}`

  while (items.some((item) => item.name === candidate)) {
    candidateNumber += 1
    candidate = `${baseName} ${candidateNumber}`
  }

  return candidate
}

function getPreferredDocumentsTab(): TabType {
  if (typeof window === 'undefined') return 'resume'

  const rawValue = window.localStorage.getItem(APPLICATION_PREP_STORAGE_KEY)
  if (!rawValue) return 'resume'

  try {
    const parsed = JSON.parse(rawValue) as { mode?: string }
    return parsed.mode === 'cover-letter' ? 'cover-letter' : 'resume'
  } catch {
    return 'resume'
  }
}

function getApplicationPrepIntent() {
  if (typeof window === 'undefined') return null

  const rawValue = window.localStorage.getItem(APPLICATION_PREP_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as {
      mode?: 'resume' | 'cover-letter'
      jobTitle?: string
      companyName?: string
      applicationUrl?: string
    }
  } catch {
    return null
  }
}

function clearApplicationPrepIntent() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(APPLICATION_PREP_STORAGE_KEY)
}

function storeResumePrepIntent(resumeId: number, prepIntent: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getResumePrepStorageKey(resumeId), JSON.stringify(prepIntent))
}

function storeCoverLetterPrepIntent(coverLetterId: number, prepIntent: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getCoverLetterPrepStorageKey(coverLetterId), JSON.stringify(prepIntent))
}

function splitDescriptionToBullets(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatProfileMonthYear(value: unknown) {
  if (typeof value !== 'string' || !value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getProfileSnapshotFromStorage() {
  if (typeof window === 'undefined') return null

  const candidateKeys = ['userProfile', 'profileData', 'profile', 'flashProfile']

  for (const key of candidateKeys) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      return JSON.parse(rawValue)
    } catch {
      continue
    }
  }

  return null
}

function buildProfileDerivedName(profile: any) {
  return (
    profile?.fullName ||
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()
  )
}

function buildInitialResumeDocument(
  resumeName: string,
  prepIntent?: {
    jobId?: string
    jobTitle?: string
    companyName?: string
    employmentType?: string
    jobMode?: string
    experienceLevel?: string
    jobDescription?: string
    applicationUrl?: string
    skillTags?: string[]
  } | null,
): ResumeDocument {
  const profile = getProfileSnapshotFromStorage()
  const profileName = buildProfileDerivedName(profile) || DEFAULT_PREVIEW_NAME

  return {
    filename: resumeName.trim() || 'Resume',
    profileName,
    phone: typeof profile?.phone === 'string' ? profile.phone : '',
    location: typeof profile?.location === 'string' ? profile.location : '',
    links: Array.isArray(profile?.links)
      ? profile.links
          .map((link: Record<string, unknown>) => ({
            label: String(link.label ?? link.site ?? ''),
            url: String(link.url ?? ''),
          }))
          .filter((link: { label: string; url: string }) => link.label.trim() || link.url.trim())
      : [],
    summary:
      prepIntent?.companyName?.trim()
        ? `Tailored for ${prepIntent.jobTitle?.trim() || 'this role'} at ${prepIntent.companyName.trim()}.`
        : '',
    education: Array.isArray(profile?.education)
      ? profile.education.map((item: Record<string, unknown>) => ({
          institution: String(item.institution ?? ''),
          degree: String(item.degree ?? ''),
          startDate: formatProfileMonthYear(item.startDate),
          endDate: formatProfileMonthYear(item.endDate),
          fieldOfStudy: String(item.fieldOfStudy ?? ''),
          description: '',
        }))
      : [],
    skills: Array.isArray(profile?.skills)
      ? profile.skills.map((item: Record<string, unknown>) => ({
          name: String(item.skill ?? ''),
          proficiency: String(item.proficiency ?? 'Expert'),
        }))
      : [],
    experiences: Array.isArray(profile?.workExperience)
      ? profile.workExperience.map((item: Record<string, unknown>) => ({
          title: String(item.position ?? ''),
          employer: String(item.company ?? ''),
          startDate: formatProfileMonthYear(item.startDate),
          endDate: formatProfileMonthYear(item.endDate),
          location: String(item.location ?? ''),
          description: '',
        }))
      : [],
    projects: Array.isArray(profile?.projects)
      ? profile.projects.map((item: Record<string, unknown>) => ({
          title: String(item.projectName ?? ''),
          employer: String(item.projectOwner ?? ''),
          startDate: formatProfileMonthYear(item.startDate),
          endDate: formatProfileMonthYear(item.endDate),
          location: String(item.location ?? ''),
          description: String(item.description ?? ''),
        }))
      : [],
    certificates: Array.isArray(profile?.certificates)
      ? profile.certificates.map((item: Record<string, unknown>) => String(item.name ?? '')).filter(Boolean)
      : [],
    languages: Array.isArray(profile?.languages)
      ? profile.languages.map((item: Record<string, unknown>) => ({
          language: String(item.language ?? ''),
          proficiency: String(item.proficiency ?? 'Native speaker'),
        }))
      : [],
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    targetJob: prepIntent
      ? {
          jobId: prepIntent.jobId || '',
          jobTitle: prepIntent.jobTitle || '',
          companyName: prepIntent.companyName || '',
          employmentType: prepIntent.employmentType || '',
          jobMode: prepIntent.jobMode || '',
          experienceLevel: prepIntent.experienceLevel || '',
          jobDescription: prepIntent.jobDescription || '',
          applicationUrl: prepIntent.applicationUrl || '',
          skillTags: prepIntent.skillTags || [],
        }
      : undefined,
  }
}

function buildExportPayload(resume: ResumeDocument) {
  return {
    meta: {
      resumeName: resume.filename.trim() || 'Resume',
      exportFormat: 'pdf' as const,
    },
    personal: {
      name: resume.profileName.trim() || DEFAULT_PREVIEW_NAME,
      phone: resume.phone.trim(),
      location: resume.location.trim(),
      links: resume.links
        .filter((link) => link.label.trim() || link.url.trim())
        .map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        })),
      summary: resume.summary.trim(),
    },
    education: resume.education
      .filter(
        (item) =>
          item.institution.trim() ||
          item.degree.trim() ||
          item.startDate.trim() ||
          item.endDate.trim() ||
          item.fieldOfStudy.trim() ||
          item.description.trim(),
      )
      .map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        fieldOfStudy: item.fieldOfStudy.trim(),
        bullets: splitDescriptionToBullets(item.description),
      })),
    skills: resume.skills
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        proficiency: item.proficiency.trim(),
      })),
    experiences: resume.experiences
      .filter(
        (item) =>
          item.title.trim() ||
          item.employer.trim() ||
          item.location.trim() ||
          item.description.trim(),
      )
      .map((item) => ({
        title: item.title.trim(),
        employer: item.employer.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        location: item.location.trim(),
        bullets: splitDescriptionToBullets(item.description),
      })),
    projects: resume.projects
      .filter(
        (item) =>
          item.title.trim() ||
          item.employer.trim() ||
          item.location.trim() ||
          item.description.trim(),
      )
      .map((item) => ({
        title: item.title.trim(),
        employer: item.employer.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        location: item.location.trim(),
        bullets: splitDescriptionToBullets(item.description),
      })),
    certificates: resume.certificates.filter((item) => item.trim()).map((item) => item.trim()),
    languages: resume.languages
      .filter((item) => item.language.trim())
      .map((item) => ({
        language: item.language.trim(),
        proficiency: item.proficiency.trim(),
      })),
    sectionTitles: { ...resume.sectionTitles },
  }
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const resumesStorageKey = getResumesStorageKey()
  const coverLettersStorageKey = getCoverLettersStorageKey()
  const [activeTab, setActiveTab] = useState<TabType>(() => getPreferredDocumentsTab())
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetterItem[]>(() =>
    readStoredItems(coverLettersStorageKey, defaultCoverLetterData),
  )
  const [selectedResumeId, setSelectedResumeId] = useState<number>(0)
  const [busyResumeActionId, setBusyResumeActionId] = useState<number | null>(null)
  const [resumePreviews, setResumePreviews] = useState<Record<number, ResumeDocument>>({})
  const [isResumeListLoading, setIsResumeListLoading] = useState(true)

  const syncResumePreview = (id: number, document: ResumeDocument) => {
    setResumePreviews((prev) => ({
      ...prev,
      [id]: document,
    }))
  }

  const removeResumePreview = (id: number) => {
    setResumePreviews((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const hydrateResumeState = (documents: ResumeDocument[]) => {
    const nextItems = documents
      .map(mapResumeDocumentToItem)
      .filter((item): item is ResumeItem => item !== null)
    const nextPreviews = documents.reduce<Record<number, ResumeDocument>>((accumulator, document) => {
      const item = mapResumeDocumentToItem(document)
      if (item) {
        accumulator[item.id] = document
      }
      return accumulator
    }, {})

    setResumes(nextItems)
    setResumePreviews(nextPreviews)
    window.localStorage.setItem(resumesStorageKey, JSON.stringify(nextItems))
  }

  const createInitialResumeRecord = async (
    id: number,
    name: string,
    prepIntent?: {
      jobId?: string
      jobTitle?: string
      companyName?: string
      employmentType?: string
      jobMode?: string
      experienceLevel?: string
      jobDescription?: string
      applicationUrl?: string
      skillTags?: string[]
    } | null,
  ) => {
    try {
      const savedResume = await saveResumeDocument(
        String(id),
        buildInitialResumeDocument(name, prepIntent),
      )
      const resumeItem = mapResumeDocumentToItem(savedResume)
      syncResumePreview(id, savedResume)
      return resumeItem
    } catch (error) {
      console.error('Failed to create initial resume record.', error)
      return null
    }
  }

  useEffect(() => {
    window.localStorage.setItem(resumesStorageKey, JSON.stringify(resumes))
  }, [resumes, resumesStorageKey])

  useEffect(() => {
    window.localStorage.setItem(coverLettersStorageKey, JSON.stringify(coverLetters))
  }, [coverLetters, coverLettersStorageKey])

  useEffect(() => {
    setCoverLetters(readStoredItems(coverLettersStorageKey, defaultCoverLetterData))
  }, [resumesStorageKey, coverLettersStorageKey])

  useEffect(() => {
    let isCancelled = false

    const loadResumes = async () => {
      setIsResumeListLoading(true)

      try {
        const documents = await listResumeDocuments()

        if (!isCancelled) {
          hydrateResumeState(documents)
        }
      } catch (error) {
        console.warn('Failed to load resumes from backend, using cached resume index.', error)
        if (!isCancelled) {
          setResumes(readStoredItems(resumesStorageKey, defaultResumeData))
        }
      } finally {
        if (!isCancelled) {
          setIsResumeListLoading(false)
        }
      }
    }

    void loadResumes()

    return () => {
      isCancelled = true
    }
  }, [resumesStorageKey])

  useEffect(() => {
    const preferredTab = getPreferredDocumentsTab()
    setActiveTab(preferredTab)
  }, [])

  useEffect(() => {
    const prepIntent = getApplicationPrepIntent()
    if (prepIntent?.mode !== 'cover-letter') return

    if (coverLetters.length >= MAX_DOCUMENTS_PER_TYPE) {
      clearApplicationPrepIntent()
      setActiveTab('cover-letter')
      return
    }

    const id = Date.now()
    const timestamp = formatTimestamp()
    const nextName = prepIntent.jobTitle?.trim()
      ? `Cover letter for ${prepIntent.jobTitle.trim()}`
      : getNextDocumentName(coverLetters, 'Cover letter')

    const nextCoverLetter: CoverLetterItem = {
      id,
      name: nextName,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    storeCoverLetterPrepIntent(id, prepIntent)
    clearApplicationPrepIntent()
    setCoverLetters((prev) => [...prev, nextCoverLetter])
    navigate(`/documents/cover-letter/${id}`)
  }, [coverLetters.length, navigate])

  useEffect(() => {
    const prepIntent = getApplicationPrepIntent()
    if (prepIntent?.mode !== 'resume') return

    if (resumes.length >= MAX_DOCUMENTS_PER_TYPE) {
      clearApplicationPrepIntent()
      setActiveTab('resume')
      return
    }

    const id = Date.now()
    const nextName = prepIntent.jobTitle?.trim()
      ? `Resume for ${prepIntent.jobTitle.trim()}`
      : getNextDocumentName(resumes, 'Resume')

    storeResumePrepIntent(id, prepIntent)
    clearApplicationPrepIntent()
    void (async () => {
      const savedResume = await createInitialResumeRecord(id, nextName, prepIntent)
      if (!savedResume) {
        window.alert('Failed to create resume. Please try again.')
        return
      }

      setResumes((prev) => [...prev, savedResume])
      setSelectedResumeId(id)
      navigate(`/documents/resume/${id}`)
    })()
  }, [navigate, resumes.length])

  useEffect(() => {
    if (resumes.length === 0) {
      setSelectedResumeId(0)
      return
    }

    const selectedResumeStillExists = resumes.some((item) => item.id === selectedResumeId)
    if (!selectedResumeStillExists) {
      setSelectedResumeId(resumes[0].id)
    }
  }, [resumes, selectedResumeId])

  const canCreateResume = resumes.length < MAX_DOCUMENTS_PER_TYPE
  const canCreateCoverLetter = coverLetters.length < MAX_DOCUMENTS_PER_TYPE

  const handleCreateResume = () => {
    if (!canCreateResume) return

    const id = Date.now()
    const nextName = getNextDocumentName(resumes, 'Resume')

    void (async () => {
      const savedResume = await createInitialResumeRecord(id, nextName, null)
      if (!savedResume) {
        window.alert('Failed to create resume. Please try again.')
        return
      }

      setResumes((prev) => [...prev, savedResume])
      setSelectedResumeId(id)
    })()
  }

  const handleDeleteResume = (id: number) => {
    setBusyResumeActionId(id)

    void (async () => {
      try {
        await deleteResumeDocument(String(id))
        setResumes((prev) => prev.filter((item) => item.id !== id))
        removeResumePreview(id)
      } catch (error) {
        console.error('Resume delete failed.', error)
        window.alert(error instanceof Error ? error.message : 'Failed to delete resume.')
      } finally {
        setBusyResumeActionId(null)
      }
    })()
  }

  const handleCopyResume = async (resume: ResumeItem) => {
    if (!canCreateResume) return

    const id = Date.now()
    const timestamp = formatTimestamp()
    const nextName = getNextDocumentName(
      resumes,
      `${resume.name.trim() || 'Resume'} copy`,
    )

    setBusyResumeActionId(resume.id)

    try {
      let copiedDocument: ResumeDocument | null = null

      try {
        const sourceDocument = await fetchResumeDocument(String(resume.id))
        copiedDocument = {
          ...sourceDocument,
          id: undefined,
          filename: nextName,
        }
      } catch {
        copiedDocument = null
      }

      if (!copiedDocument) {
        throw new Error('Unable to load the source resume to copy.')
      }

      const savedResume = await saveResumeDocument(String(id), copiedDocument)
      const resumeItem = mapResumeDocumentToItem(savedResume)
      syncResumePreview(id, savedResume)

      setResumes((prev) => [
        ...prev,
        resumeItem ?? {
          id,
          name: nextName,
          updatedAt: timestamp,
        },
      ])
      setSelectedResumeId(id)
    } catch (error) {
      console.error('Resume copy failed.', error)
      window.alert(error instanceof Error ? error.message : 'Failed to copy resume.')
    } finally {
      setBusyResumeActionId(null)
    }
  }

  const handleExportResume = async (resume: ResumeItem) => {
    setBusyResumeActionId(resume.id)

    try {
      const resumeDocument = await fetchResumeDocument(String(resume.id))
      const response = await authFetch('/api/resumes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildExportPayload(resumeDocument)),
      })

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('application/json')) {
          const payload = (await response.json()) as { message?: string; error?: string }
          throw new Error(payload.message || payload.error || 'Resume export failed.')
        }

        throw new Error('Resume export failed.')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `${(resumeDocument.filename || resume.name || 'resume').trim() || 'resume'}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Resume export failed.', error)
      window.alert(
        error instanceof Error && error.message.includes('Failed to load resume: 404')
          ? 'This resume is not available to export yet. Open it once or save it in the editor, then try again.'
          : error instanceof Error
            ? error.message
            : 'Please save this resume in the editor before exporting it.',
      )
    } finally {
      setBusyResumeActionId(null)
    }
  }

  const handleCreateCoverLetter = () => {
    if (!canCreateCoverLetter) return

    const id = Date.now()
    const timestamp = formatTimestamp()
    const nextCoverLetter: CoverLetterItem = {
      id,
      name: getNextDocumentName(coverLetters, 'Cover letter'),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setCoverLetters((prev) => [...prev, nextCoverLetter])
    navigate(`/documents/cover-letter/${id}`)
  }

  const handleDeleteCoverLetter = (id: number) => {
    setCoverLetters((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-[1200px] text-white">
      <div className="border-t border-white/15 pt-2">
        <div className="mb-5 flex items-center justify-center gap-10 border-b border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            className={`relative px-3 pb-3 pt-1 text-[18px] transition ${
              activeTab === 'resume' ? 'text-white' : 'text-white/80'
            }`}
          >
            Resume
            {activeTab === 'resume' && (
              <span className="absolute bottom-0 left-0 h-[4px] w-full bg-[#E7F12E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cover-letter')}
            className={`relative px-3 pb-3 pt-1 text-[18px] transition ${
              activeTab === 'cover-letter' ? 'text-white' : 'text-white/80'
            }`}
          >
            Cover letter
            {activeTab === 'cover-letter' && (
              <span className="absolute bottom-0 left-0 h-[4px] w-full bg-[#E7F12E]" />
            )}
          </button>
        </div>

        {activeTab === 'resume' ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resumes.map((item) => {
              const isSelected = item.id === selectedResumeId

              return (
                <div
                  key={item.id}
                  className={`space-y-4 rounded-md p-2 transition ${
                    isSelected ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedResumeId(item.id)}
                      className={`h-[170px] w-[120px] shrink-0 overflow-hidden rounded-[2px] bg-[#EFEFEF] text-left transition ${
                        isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                      }`}
                      aria-label={`Select ${item.name}`}
                    >
                      <ResumeThumbnail
                        resume={resumePreviews[item.id]}
                        fallbackName={item.name}
                      />
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedResumeId(item.id)}
                        className={`w-full text-left transition ${
                          isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        <h2 className="truncate text-[18px] font-semibold">{item.name}</h2>
                        <p className="mt-1 text-[13px] text-white/60">
                          Updated on {item.updatedAt}
                        </p>
                      </button>

                      <div className="my-2 h-px bg-white/15" />

                      <div className="space-y-4 pt-2 text-[14px] text-white/85">
                        <button
                          type="button"
                          onClick={() => void handleCopyResume(item)}
                          disabled={!canCreateResume || busyResumeActionId === item.id}
                          className="flex items-center gap-3 transition hover:text-[#E7F12E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Copy size={18} />
                          <span>{busyResumeActionId === item.id ? 'Working...' : 'Make a copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleExportResume(item)}
                          disabled={busyResumeActionId === item.id}
                          className="flex items-center gap-3 transition hover:text-[#E7F12E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileText size={18} />
                          <span>{busyResumeActionId === item.id ? 'Exporting...' : 'Export as pdf'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/documents/resume/${item.id}`}
                    className="block w-full rounded-md bg-[#E7F12E] px-5 py-3 text-center text-[16px] font-semibold text-black transition hover:opacity-95"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteResume(item.id)}
                    disabled={busyResumeActionId === item.id}
                    className="flex w-full items-center justify-center gap-2 rounded-md border-[3px] border-[#E63B3B] px-5 py-3 text-[16px] font-semibold text-[#E63B3B] transition hover:bg-[#E63B3B]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    {busyResumeActionId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )
            })}

            {canCreateResume && (
              <button
                type="button"
                onClick={handleCreateResume}
                className="flex min-h-[275px] items-center justify-center rounded-md border-[3px] border-dashed border-white/25 transition hover:border-[#E7F12E]"
              >
                <span className="rounded-md bg-[#E7F12E] px-8 py-3 text-center text-[16px] font-semibold text-black">
                  Create new resume
                </span>
              </button>
            )}

            {isResumeListLoading && resumes.length === 0 && (
              <div className="flex min-h-[275px] items-center justify-center rounded-md border border-white/15 bg-white/5 px-6 text-center text-white/70">
                Loading resumes...
              </div>
            )}

            {!isResumeListLoading && !canCreateResume && resumes.length === 0 && (
              <div className="flex min-h-[275px] items-center justify-center rounded-md border border-white/15 bg-white/5 px-6 text-center text-white/70">
                Resume limit reached (3/3)
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-white/65">
                {coverLetters.length}/{MAX_DOCUMENTS_PER_TYPE} cover letters created
              </p>

              <button
                type="button"
                onClick={handleCreateCoverLetter}
                disabled={!canCreateCoverLetter}
                className={`rounded-md px-5 py-2.5 text-[15px] font-semibold transition ${
                  canCreateCoverLetter
                    ? 'bg-[#E7F12E] text-black hover:opacity-95'
                    : 'cursor-not-allowed bg-white/15 text-white/50'
                }`}
              >
                {canCreateCoverLetter
                  ? 'Create new cover letter'
                  : 'Cover letter limit reached (3/3)'}
              </button>
            </div>

            <div className="grid grid-cols-[1.4fr_1.3fr_1.3fr_1fr] bg-[#E9E9E6] px-6 py-3 text-[18px] font-medium text-black">
              <div>Name</div>
              <div>Created</div>
              <div>Last edited</div>
              <div className="text-center">Action</div>
            </div>

            <div>
              {coverLetters.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.4fr_1.3fr_1.3fr_1fr] items-center border-b border-white/15 px-6 py-6 text-[16px]"
                >
                  <div>{item.name}</div>
                  <div>{item.createdAt}</div>
                  <div>{item.updatedAt}</div>

                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to={`/documents/cover-letter/${item.id}`}
                      className="min-w-[120px] rounded-md bg-[#E7F12E] px-5 py-2.5 text-center font-semibold text-black transition hover:opacity-95"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoverLetter(item.id)}
                      className="min-w-[120px] rounded-md border-[3px] border-[#E63B3B] px-5 py-2.5 font-semibold text-[#E63B3B] transition hover:bg-[#E63B3B]/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {coverLetters.length === 0 && (
                <div className="border-b border-white/15 px-6 py-8 text-center text-white/60">
                  No cover letters yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResumeThumbnail({
  resume,
  fallbackName,
}: {
  resume?: ResumeDocument
  fallbackName: string
}) {
  const displayName = resume?.profileName?.trim() || DEFAULT_PREVIEW_NAME
  const details = [
    resume?.phone?.trim(),
    resume?.location?.trim(),
    ...(resume?.links ?? [])
      .map((link) => link.label.trim() || link.url.trim())
      .filter(Boolean)
      .slice(0, 2),
  ].filter(Boolean) as string[]

  const visibleSummary = resume?.summary?.trim()
  const visibleExperience = (resume?.experiences ?? []).filter(
    (item) => item.title.trim() || item.employer.trim(),
  )
  const visibleProjects = (resume?.projects ?? []).filter(
    (item) => item.title.trim() || item.employer.trim(),
  )
  const visibleSkills = (resume?.skills ?? []).filter((item) => item.name.trim())

  return (
    <div className="h-full w-full bg-[#F7F3EA] px-3 py-3 text-[#1E1E1D]">
      <div className="border-b border-black/10 pb-2">
        <div className="truncate text-[10px] font-semibold leading-none">{displayName}</div>
        {details.length > 0 ? (
          <div className="mt-1 space-y-0.5 text-[5px] leading-[1.25] text-black/65">
            {details.slice(0, 3).map((detail, index) => (
              <div key={`${detail}-${index}`} className="truncate">
                {detail}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[5px] text-black/45">{fallbackName}</div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        {visibleSummary ? (
          <ResumeThumbnailSection title="Summary">
            <p className="line-clamp-3 text-[5px] leading-[1.35] text-black/70">{visibleSummary}</p>
          </ResumeThumbnailSection>
        ) : null}

        {visibleExperience.length > 0 ? (
          <ResumeThumbnailSection title="Experience">
            {visibleExperience.slice(0, 2).map((item, index) => (
              <div key={`${item.title}-${item.employer}-${index}`} className="mb-1 last:mb-0">
                <div className="truncate text-[5px] font-semibold text-black/80">
                  {item.title.trim() || 'Role'}
                </div>
                <div className="truncate text-[5px] text-black/60">
                  {item.employer.trim() || item.location.trim() || 'Company'}
                </div>
              </div>
            ))}
          </ResumeThumbnailSection>
        ) : null}

        {visibleProjects.length > 0 ? (
          <ResumeThumbnailSection title="Projects">
            {visibleProjects.slice(0, 2).map((item, index) => (
              <div key={`${item.title}-${index}`} className="truncate text-[5px] text-black/70">
                {item.title.trim() || item.employer.trim() || 'Project'}
              </div>
            ))}
          </ResumeThumbnailSection>
        ) : null}

        {visibleSkills.length > 0 ? (
          <ResumeThumbnailSection title="Skills">
            <div className="flex flex-wrap gap-1">
              {visibleSkills.slice(0, 4).map((item, index) => (
                <span
                  key={`${item.name}-${index}`}
                  className="rounded bg-black/5 px-1 py-0.5 text-[4.5px] text-black/65"
                >
                  {item.name.trim()}
                </span>
              ))}
            </div>
          </ResumeThumbnailSection>
        ) : null}
      </div>
    </div>
  )
}

function ResumeThumbnailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-1 text-[5px] font-semibold uppercase tracking-[0.08em] text-black/45">
        {title}
      </div>
      {children}
    </section>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Sparkles, Trash2, WandSparkles, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { authFetch } from '../../lib/authApi'
import { improveCoverLetterTextWithAi, reviewCoverLetterWithAi, type CoverLetterAiImproveResponse, type CoverLetterAiReviewResponse } from '../../lib/coverLetterAiApi'
import type { ResumeTargetJob } from '../../lib/resumeApi'
import { fetchCurrentUserProfile, getCurrentUserId } from '../../lib/profileApi'

type CoverLetterLink = {
  id: number
  label: string
  url: string
}

type CoverLetterDraft = {
  coverLetterName: string
  profileName: string
  phone: string
  location: string
  links: CoverLetterLink[]
  companyName: string
  hiringManagerName: string
  letterBody: string
  lastSavedAt: string
}

type CoverLetterDocumentMeta = {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

type ProfileSnapshot = {
  name: string
  phone: string
  location: string
  links: CoverLetterLink[]
}

const APPLICATION_PREP_STORAGE_KEY = 'jobs:applicationPrep'
const DEFAULT_PROFILE_NAME = 'Your Name'
const EXPORT_REQUEST_TIMEOUT_MS = 60000

function getCoverLettersStorageKey() {
  return `documents:coverLetters:${getCurrentUserId()}`
}

function getCoverLetterPrepStorageKey(coverLetterId: string) {
  return `documents:coverLetterPrep:${getCurrentUserId()}:${coverLetterId}`
}

type AiDialogState =
  | {
      mode: 'review'
      loading: boolean
      error: string | null
      data: CoverLetterAiReviewResponse | null
    }
  | {
      mode: 'improve'
      loading: boolean
      error: string | null
      data: CoverLetterAiImproveResponse | null
      onApply: ((text: string) => void) | null
      title: string
    }
  | null

type EditableHeadingProps = {
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
  showPencil?: boolean
}

function EditableHeading({
  value,
  onChange,
  className = '',
  inputClassName = '',
  showPencil = true,
}: EditableHeadingProps) {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setIsEditing(false)
        }}
        className={inputClassName}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`group inline-flex items-center gap-2 text-left transition ${className}`}
    >
      <span>{value}</span>
      {showPencil ? <Pencil size={16} className="opacity-0 transition group-hover:opacity-100" /> : null}
    </button>
  )
}

function getDetailStorageKey(id: string) {
  return `documents:coverLetter:${getCurrentUserId()}:${id}`
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

function buildDefaultDraft(documentName: string): CoverLetterDraft {
  return {
    coverLetterName: documentName,
    profileName: DEFAULT_PROFILE_NAME,
    phone: '',
    location: '',
    links: [{ id: 1, label: '', url: '' }],
    companyName: '',
    hiringManagerName: '',
    letterBody: '',
    lastSavedAt: '',
  }
}

function readCoverLetterDocuments(): CoverLetterDocumentMeta[] {
  if (typeof window === 'undefined') return []

  const rawValue = window.localStorage.getItem(getCoverLettersStorageKey())
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readCoverLetterDraft(id: string, fallbackName: string) {
  if (typeof window === 'undefined') return buildDefaultDraft(fallbackName)

  const rawValue = window.localStorage.getItem(getDetailStorageKey(id))
  if (!rawValue) return buildDefaultDraft(fallbackName)

  try {
    const parsed = JSON.parse(rawValue)
    return {
      ...buildDefaultDraft(fallbackName),
      ...parsed,
      links:
        Array.isArray(parsed?.links) && parsed.links.length > 0
          ? parsed.links
          : buildDefaultDraft(fallbackName).links,
    } as CoverLetterDraft
  } catch {
    return buildDefaultDraft(fallbackName)
  }
}

function getApplicationPrepContext() {
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

function clearApplicationPrepContext() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(APPLICATION_PREP_STORAGE_KEY)
}

function getStoredCoverLetterPrepContext(coverLetterId: string) {
  if (typeof window === 'undefined' || !coverLetterId) return null

  const rawValue = window.localStorage.getItem(getCoverLetterPrepStorageKey(coverLetterId))
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as {
      mode?: 'resume' | 'cover-letter'
      jobId?: string
      jobTitle?: string
      companyName?: string
      employmentType?: string
      jobMode?: string
      experienceLevel?: string
      jobDescription?: string
      applicationUrl?: string
      skillTags?: string[]
    }
  } catch {
    return null
  }
}

function clearStoredCoverLetterPrepContext(coverLetterId: string) {
  if (typeof window === 'undefined' || !coverLetterId) return
  window.localStorage.removeItem(getCoverLetterPrepStorageKey(coverLetterId))
}

function mapPrepContextToTargetJob(
  prepContext:
    | {
        mode?: 'resume' | 'cover-letter'
        jobId?: string
        jobTitle?: string
        companyName?: string
        employmentType?: string
        jobMode?: string
        experienceLevel?: string
        jobDescription?: string
        applicationUrl?: string
        skillTags?: string[]
      }
    | null
    | undefined,
): ResumeTargetJob | undefined {
  if (!prepContext || prepContext.mode !== 'cover-letter') return undefined

  return {
    jobId: prepContext.jobId || '',
    jobTitle: prepContext.jobTitle || '',
    companyName: prepContext.companyName || '',
    employmentType: prepContext.employmentType || '',
    jobMode: prepContext.jobMode || '',
    experienceLevel: prepContext.experienceLevel || '',
    jobDescription: prepContext.jobDescription || '',
    applicationUrl: prepContext.applicationUrl || '',
    skillTags: prepContext.skillTags || [],
  }
}

function getProfileSnapshotFromStorage(): ProfileSnapshot {
  if (typeof window === 'undefined') {
    return {
      name: '',
      phone: '',
      location: '',
      links: [],
    }
  }

  const candidateKeys = ['profileData', 'userProfile', 'profile', 'flashProfile']

  for (const key of candidateKeys) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      const parsed = JSON.parse(rawValue)
      const fullName = [parsed?.firstName, parsed?.lastName].filter(Boolean).join(' ').trim()
      const nameCandidate =
        parsed?.name ??
        parsed?.fullName ??
        parsed?.personalDetails?.name ??
        parsed?.personalDetails?.fullName ??
        fullName

      const phoneCandidate =
        parsed?.phone ??
        parsed?.phoneNumber ??
        parsed?.mobile ??
        parsed?.personalDetails?.phone ??
        parsed?.personalDetails?.phoneNumber ??
        ''

      const locationCandidate =
        parsed?.location ??
        parsed?.personalDetails?.location ??
        [parsed?.city, parsed?.country].filter(Boolean).join(', ') ??
        ''

      const linkCandidates = [
        ...(Array.isArray(parsed?.links) ? parsed.links : []),
        ...(Array.isArray(parsed?.personalDetails?.links) ? parsed.personalDetails.links : []),
      ]

      const normalizedLinks = linkCandidates
        .map((item: unknown, index: number) => {
          if (!item || typeof item !== 'object') return null
          const record = item as Record<string, unknown>
          const label = String(record.label ?? record.name ?? '')
          const url = String(record.url ?? record.href ?? '')
          if (!label.trim() && !url.trim()) return null
          return {
            id: Date.now() + index,
            label,
            url,
          }
        })
        .filter(Boolean) as CoverLetterLink[]

      return {
        name: typeof nameCandidate === 'string' ? nameCandidate.trim() : '',
        phone: typeof phoneCandidate === 'string' ? phoneCandidate.trim() : '',
        location: typeof locationCandidate === 'string' ? locationCandidate.trim() : '',
        links: normalizedLinks,
      }
    } catch {
      continue
    }
  }

  return {
    name: '',
    phone: '',
    location: '',
    links: [],
  }
}

function visibleLinks(links: CoverLetterLink[]) {
  return links.filter((link) => link.label.trim() || link.url.trim())
}

function isPlaceholderProfileName(value?: string) {
  return !value || !value.trim() || value.trim() === DEFAULT_PROFILE_NAME
}

function buildExportPayload({
  coverLetterName,
  profileName,
  phone,
  location,
  links,
  companyName,
  hiringManagerName,
  letterBody,
}: Pick<
  CoverLetterDraft,
  'coverLetterName' | 'profileName' | 'phone' | 'location' | 'links' | 'companyName' | 'hiringManagerName' | 'letterBody'
>) {
  const paragraphs = letterBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return {
    meta: {
      coverLetterName: coverLetterName.trim() || 'Cover Letter',
      exportFormat: 'pdf' as const,
    },
    sender: {
      name: isPlaceholderProfileName(profileName) ? '' : profileName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      links: visibleLinks(links).map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      })),
    },
    recipient: {
      companyName: companyName.trim(),
      hiringManagerName: hiringManagerName.trim(),
      date: formatTimestamp(new Date()),
    },
    body: {
      greeting: `Dear ${hiringManagerName.trim() || 'Hiring Manager'},`,
      paragraphs,
      closing: 'Sincerely,',
      signature: isPlaceholderProfileName(profileName) ? '' : profileName.trim(),
    },
  }
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'cover-letter'
}

export default function CoverLetterEditorPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const [coverLetterName, setCoverLetterName] = useState('Cover letter for Function A')
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME)
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [links, setLinks] = useState<CoverLetterLink[]>([{ id: 1, label: '', url: '' }])
  const [companyName, setCompanyName] = useState('')
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [letterBody, setLetterBody] = useState('')
  const [saveStatus, setSaveStatus] = useState('Not saved yet')
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0)
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [targetJob, setTargetJob] = useState<ResumeTargetJob | undefined>(undefined)
  const [aiDialog, setAiDialog] = useState<AiDialogState>(null)
  const panStartRef = useRef({ x: 0, y: 0 })
  const panOriginRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const documents = readCoverLetterDocuments()
    const documentMeta = documents.find((item) => String(item.id) === id)
    const fallbackName = documentMeta?.name || 'Cover letter for Function A'
    const draft = readCoverLetterDraft(id, fallbackName)
    const prepContext = getApplicationPrepContext()
    const storedPrepContext = getStoredCoverLetterPrepContext(id)
    const resolvedPrepContext =
      prepContext?.mode === 'cover-letter' ? prepContext : storedPrepContext
    const profile = getProfileSnapshotFromStorage()
    const preparedCoverLetterName =
      resolvedPrepContext?.mode === 'cover-letter' && resolvedPrepContext.jobTitle?.trim()
        ? `Cover letter for ${resolvedPrepContext.jobTitle.trim()}`
        : ''

    setCoverLetterName(draft.coverLetterName || preparedCoverLetterName || fallbackName)
    setProfileName(
      !isPlaceholderProfileName(draft.profileName)
        ? draft.profileName
        : profile.name || DEFAULT_PROFILE_NAME,
    )
    setPhone(draft.phone || profile.phone || '')
    setLocation(draft.location || profile.location || '')
    setLinks(
      draft.links.length > 0
        ? draft.links
        : profile.links.length > 0
          ? profile.links
          : [{ id: 1, label: '', url: '' }],
    )
    setCompanyName(
      draft.companyName || (resolvedPrepContext?.mode === 'cover-letter' ? resolvedPrepContext.companyName || '' : ''),
    )
    setHiringManagerName(draft.hiringManagerName || '')
    setLetterBody(draft.letterBody || '')
    setSaveStatus(
      draft.lastSavedAt || documentMeta?.updatedAt
        ? `Last saved at ${draft.lastSavedAt || documentMeta?.updatedAt}`
        : 'Not saved yet',
    )
    setTargetJob(mapPrepContextToTargetJob(resolvedPrepContext))

    if (prepContext?.mode === 'cover-letter') {
      clearApplicationPrepContext()
    }
  }, [id])

  useEffect(() => {
    const loadCurrentUserName = async () => {
      if (!isPlaceholderProfileName(profileName)) {
        return
      }

      try {
        const profile = await fetchCurrentUserProfile()
        const fullName =
          profile.fullName?.trim() ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()

        if (fullName) {
          setProfileName(fullName)
        }
      } catch {
        // Keep the current placeholder when profile data is unavailable.
      }
    }

    void loadCurrentUserName()
  }, [profileName])

  const previewLinks = useMemo(() => visibleLinks(links), [links])
  const previewParagraphs = useMemo(
    () =>
      letterBody
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [letterBody],
  )

  const previewDetails = [
    phone.trim(),
    location.trim(),
    ...previewLinks.map((link) =>
      link.label.trim() && link.url.trim()
        ? `${link.label.trim()}: ${link.url.trim()}`
        : link.label.trim() || link.url.trim(),
    ),
  ].filter(Boolean)

  const applyProfileDefaults = () => {
    const profile = getProfileSnapshotFromStorage()

    if (profile.name) {
      setProfileName(profile.name)
    }

    setPhone(profile.phone)
    setLocation(profile.location)
    setLinks(profile.links.length > 0 ? profile.links : [{ id: Date.now(), label: '', url: '' }])
  }

  const closeAiDialog = () => setAiDialog(null)

  const buildCoverLetterAiDocument = () => ({
    coverLetterName: coverLetterName.trim() || 'Cover Letter',
    profileName: isPlaceholderProfileName(profileName) ? '' : profileName.trim(),
    phone: phone.trim(),
    location: location.trim(),
    links: visibleLinks(links).map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    })),
    companyName: companyName.trim() || targetJob?.companyName || '',
    hiringManagerName: hiringManagerName.trim(),
    letterBody: letterBody.trim(),
    targetJob,
  })

  const handleReviewWithAi = async () => {
    const coverLetterDocument = buildCoverLetterAiDocument()

    setAiDialog({
      mode: 'review',
      loading: true,
      error: null,
      data: null,
    })

    try {
      const result = await reviewCoverLetterWithAi(coverLetterDocument)
      setAiDialog({
        mode: 'review',
        loading: false,
        error: null,
        data: result,
      })
    } catch (error) {
      setAiDialog({
        mode: 'review',
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to review cover letter with AI.',
        data: null,
      })
    }
  }

  const handleImproveLetterWithAi = async () => {
    const coverLetterDocument = buildCoverLetterAiDocument()

    setAiDialog({
      mode: 'improve',
      loading: true,
      error: null,
      data: null,
      onApply: null,
      title: 'Improve Cover Letter Body',
    })

    try {
      const result = await improveCoverLetterTextWithAi(coverLetterDocument, {
        sectionType: 'letter-body',
        currentText: letterBody,
        itemTitle: targetJob?.jobTitle,
        itemSubtitle: companyName || targetJob?.companyName,
      })

      setAiDialog({
        mode: 'improve',
        loading: false,
        error: null,
        data: result,
        title: 'Improve Cover Letter Body',
        onApply: setLetterBody,
      })
    } catch (error) {
      setAiDialog({
        mode: 'improve',
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to improve cover letter with AI.',
        data: null,
        title: 'Improve Cover Letter Body',
        onApply: null,
      })
    }
  }

  const handleLinkChange = (
    linkId: number,
    field: keyof CoverLetterLink,
    value: string,
  ) => {
    setLinks((prev) =>
      prev.map((item) => (item.id === linkId ? { ...item, [field]: value } : item)),
    )
  }

  const addNewLink = () => {
    setLinks((prev) => [...prev, { id: Date.now(), label: '', url: '' }])
  }

  const deleteLink = (linkId: number) => {
    setLinks((prev) => {
      const nextLinks = prev.filter((item) => item.id !== linkId)
      return nextLinks.length > 0 ? nextLinks : [{ id: Date.now(), label: '', url: '' }]
    })
  }

  const handleSave = () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const timestamp = formatTimestamp()
      const normalizedName = coverLetterName.trim() || 'Untitled cover letter'
      const draft: CoverLetterDraft = {
        coverLetterName: normalizedName,
        profileName: isPlaceholderProfileName(profileName) ? '' : profileName.trim(),
        phone,
        location,
        links,
        companyName,
        hiringManagerName,
        letterBody,
        lastSavedAt: timestamp,
      }

      window.localStorage.setItem(getDetailStorageKey(id), JSON.stringify(draft))

      const existingDocuments = readCoverLetterDocuments()
      const existingMeta = existingDocuments.find((item) => String(item.id) === id)
      const nextDocuments =
        existingMeta == null
          ? [
              ...existingDocuments,
              {
                id: Number(id),
                name: normalizedName,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ]
          : existingDocuments.map((item) =>
              String(item.id) === id
                ? {
                    ...item,
                    name: normalizedName,
                    updatedAt: timestamp,
                  }
                : item,
            )

      window.localStorage.setItem(getCoverLettersStorageKey(), JSON.stringify(nextDocuments))
      setCoverLetterName(normalizedName)
      setSaveStatus(`Last saved at ${timestamp}`)
      if (targetJob) {
        clearStoredCoverLetterPrepContext(id)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    let timeoutId: number | undefined

    try {
      const controller = new AbortController()
      timeoutId = window.setTimeout(() => controller.abort(), EXPORT_REQUEST_TIMEOUT_MS)
      const response = await authFetch('/api/cover-letters/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(
          buildExportPayload({
            coverLetterName,
            profileName,
            phone,
            location,
            links,
            companyName,
            hiringManagerName,
            letterBody,
          }),
        ),
      })

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('application/json')) {
          const payload = (await response.json()) as { message?: string; error?: string }
          throw new Error(payload.message || payload.error || 'Cover letter export failed.')
        }

        throw new Error('Cover letter export failed.')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `${sanitizeFilename(coverLetterName)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Cover letter export failed.', error)
      if (error instanceof DOMException && error.name === 'AbortError') {
        window.alert('Cover letter export timed out. Please try again.')
      } else {
        window.alert(error instanceof Error ? error.message : 'Cover letter export failed.')
      }
    } finally {
      if (timeoutId != null) {
        window.clearTimeout(timeoutId)
      }
      setIsExporting(false)
    }
  }

  const handleBackToDocuments = () => {
    const shouldLeave = window.confirm(
      'Please make sure you save your cover letter before leaving. Go back to Documents anyway?',
    )

    if (!shouldLeave) return

    navigate('/documents')
  }

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    setPan({ x: 0, y: 0 })
  }, [zoom, currentPreviewPage])

  const startPan = (clientX: number, clientY: number) => {
    if (zoom <= 0.7) return
    setIsPanning(true)
    panStartRef.current = { x: clientX, y: clientY }
    panOriginRef.current = pan
  }

  const movePan = (clientX: number, clientY: number) => {
    if (!isPanning) return
    const dx = clientX - panStartRef.current.x
    const dy = clientY - panStartRef.current.y
    setPan({
      x: panOriginRef.current.x + dx,
      y: panOriginRef.current.y + dy,
    })
  }

  const stopPan = () => {
    setIsPanning(false)
  }

  return (
    <div className="relative min-h-screen bg-[#41413F] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#161616] px-4 py-5 md:px-6">
        <button type="button" onClick={handleBackToDocuments} className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
            Flash
          </span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </button>

        <div className="flex items-center gap-4 md:gap-5">
          <p className="hidden text-[14px] text-white/80 md:block">
            {isSaving ? 'Saving cover letter...' : isExporting ? 'Exporting...' : saveStatus}
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-[#FBF54A] px-6 py-3 text-[18px] font-semibold text-black transition hover:opacity-95 md:px-8"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-md bg-[#FBF54A] px-6 py-3 text-[18px] font-semibold text-black transition hover:opacity-95 md:px-8"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </header>

      <main className="grid w-full items-start gap-5 px-6 py-4 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <section className="min-w-0">
          <button
            type="button"
            onClick={handleBackToDocuments}
            className="mb-4 inline-flex items-center gap-2 text-[14px] text-white/85 transition hover:text-white"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="mb-4 flex items-center justify-between gap-4">
            <EditableHeading
              value={coverLetterName}
              onChange={setCoverLetterName}
              className="text-[24px] font-semibold text-white"
              inputClassName="w-full rounded bg-transparent px-1 text-[24px] font-semibold text-white outline-none ring-1 ring-white/40"
            />

            <button
              type="button"
              onClick={handleReviewWithAi}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FBF54A] px-5 py-2 text-[16px] font-medium text-black transition hover:opacity-95"
            >
              <Sparkles size={16} />
              Review with AI
            </button>
          </div>

          <div className="space-y-3">
            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-white">Personal Details</h2>
                  <span className="text-[12px] text-white/50">(Optional)</span>
                </div>

                <button
                  type="button"
                  onClick={applyProfileDefaults}
                  className="rounded-md bg-[#FBF54A] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] text-white/90">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Phone number"
                      className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] text-white/90">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Location"
                      className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="block text-[12px] text-white/90">Links</label>
                    <span className="text-[12px] text-white/45">e.g., LinkedIn, personal website</span>
                  </div>

                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="rounded-[4px] bg-[#7A7974] p-2">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                          <div>
                            <label className="mb-1 block text-[12px] text-white/90">Label</label>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(event) =>
                                handleLinkChange(link.id, 'label', event.target.value)
                              }
                              placeholder="Label"
                              className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[12px] text-white/90">URL</label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(event) =>
                                handleLinkChange(link.id, 'url', event.target.value)
                              }
                              placeholder="URL"
                              className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteLink(link.id)}
                            className="self-end pb-2 text-white/90 transition hover:text-[#FBF54A]"
                            aria-label="Delete link"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addNewLink}
                    className="mt-3 block w-full text-center text-[14px] text-white/85 transition hover:text-[#FBF54A]"
                  >
                    + Add new link
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <h2 className="mb-3 text-[18px] font-semibold text-white">Employer Details</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] text-white/90">Company</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Company name"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] text-white/90">
                    Hiring manager&apos;s name
                  </label>
                  <input
                    type="text"
                    value={hiringManagerName}
                    onChange={(event) => setHiringManagerName(event.target.value)}
                    placeholder="Name"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <h2 className="text-[18px] font-semibold text-white">Letter Details</h2>

                <button
                  type="button"
                  onClick={() => void handleImproveLetterWithAi()}
                  className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#FBF54A] px-4 py-1.5 text-[15px] font-medium text-[#FBF54A] transition hover:bg-[#FBF54A]/10"
                >
                  <WandSparkles size={15} />
                  Get help with AI
                </button>
              </div>

              <textarea
                rows={7}
                value={letterBody}
                onChange={(event) => setLetterBody(event.target.value)}
                placeholder="Write 3–4 paragraphs explaining why you're the perfect candidate for a specific job"
                className="min-h-[132px] w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
              />
            </section>
          </div>
        </section>

        <section className="min-w-0 self-start xl:sticky xl:top-30">
          <div className="relative sticky top-20 flex h-[85vh] min-h-[700px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#5B5A56] shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#666662] px-4 py-3 text-white">
              <div className="text-sm font-medium">Preview</div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                  className="rounded border border-white/15 bg-[#4F4E4A] px-3 py-1 text-sm text-white transition hover:bg-white/10"
                >
                  -
                </button>
                <span className="min-w-[60px] text-center text-sm">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(1.8, Number((prev + 0.1).toFixed(2))))}
                  className="rounded border border-white/15 bg-[#4F4E4A] px-3 py-1 text-sm text-white transition hover:bg-white/10"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(0.58)
                    setPan({ x: 0, y: 0 })
                  }}
                  className="rounded border border-white/15 bg-[#4F4E4A] px-3 py-1 text-sm text-white transition hover:bg-white/10"
                >
                  Reset view
                </button>
              </div>
            </div>

            <div
              className={`relative flex-1 overflow-hidden bg-[#4A4946] ${zoom > 0.7 ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
              onMouseDown={(e) => startPan(e.clientX, e.clientY)}
              onMouseMove={(e) => movePan(e.clientX, e.clientY)}
              onMouseUp={stopPan}
              onMouseLeave={stopPan}
            >
              <div
                className="absolute left-1/2 top-6"
                style={{
                  transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top center',
                }}
              >
                <div
                  className="mb-8 rounded-[2px] bg-[#F4F1E8] shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
                  style={{
                    width: '794px',
                    minHeight: '1123px',
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >
                  <div className="px-12 py-12 text-[15px] leading-[1.5] text-black">
                    <header className="mb-10">
                      <h1 className="text-[30px] font-semibold leading-none text-black">
                        {profileName.trim() || DEFAULT_PROFILE_NAME}
                      </h1>

                      {previewDetails.length > 0 ? (
                        <div className="mt-3 space-y-1 text-[13px] text-black/75">
                          {previewDetails.map((detail, index) => (
                            <div key={`${detail}-${index}`}>{detail}</div>
                          ))}
                        </div>
                      ) : null}
                    </header>

                    <div className="space-y-5">
                      <p>{formatTimestamp(new Date())}</p>

                      {(companyName.trim() || hiringManagerName.trim()) ? (
                        <div className="space-y-1">
                          {companyName.trim() ? <p>{companyName.trim()}</p> : null}
                          {hiringManagerName.trim() ? <p>{hiringManagerName.trim()}</p> : null}
                        </div>
                      ) : null}

                      <p>Dear {hiringManagerName.trim() || 'Hiring Manager'},</p>

                      {previewParagraphs.length > 0 ? (
                        <div className="space-y-4">
                          {previewParagraphs.map((paragraph, index) => (
                            <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-black/35">
                          Your cover letter preview will appear here as you write.
                        </p>
                      )}

                      <div className="pt-4">
                        <p>Sincerely,</p>
                        <p className="mt-6">{profileName.trim() || DEFAULT_PROFILE_NAME}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-[#3C3B39]/90 px-5 py-2 text-[18px] text-white backdrop-blur">
              <button
                type="button"
                onClick={() => setCurrentPreviewPage(0)}
                className="opacity-90 hover:opacity-100"
              >
                ‹
              </button>
              <span>{currentPreviewPage + 1} / 1</span>
              <button
                type="button"
                onClick={() => setCurrentPreviewPage(0)}
                className="opacity-90 hover:opacity-100"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </main>

      {aiDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[760px] rounded-3xl bg-[#F0EFEA] p-6 text-[#1E1E1D] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-semibold">
                  {aiDialog.mode === 'review' ? 'AI Cover Letter Review' : aiDialog.title}
                </h3>
                {targetJob ? (
                  <p className="mt-2 text-[15px] leading-6 text-black/70">
                    Tailored against {targetJob.jobTitle} at {targetJob.companyName}.
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeAiDialog}
                className="rounded-full border border-black/10 px-3 py-1 text-[14px] text-black/65 transition hover:bg-black/5 hover:text-black"
              >
                Close
              </button>
            </div>

            {aiDialog.loading ? (
              <div className="mt-6 rounded-2xl bg-white px-5 py-6 text-[15px] text-black/70">
                AI is reviewing your cover letter...
              </div>
            ) : aiDialog.error ? (
              <div className="mt-6 rounded-2xl bg-white px-5 py-6 text-[15px] text-red-500">
                {aiDialog.error}
              </div>
            ) : aiDialog.mode === 'review' && aiDialog.data ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white p-5">
                  <h4 className="text-[17px] font-semibold">Overall Assessment</h4>
                  <p className="mt-2 text-[15px] leading-7 text-black/75">{aiDialog.data.overallAssessment}</p>
                </div>

                <AiListCard title="Strengths" items={aiDialog.data.strengths} />
                <AiListCard title="Improvements" items={aiDialog.data.improvements} />
                <AiListCard title="Priority Changes" items={aiDialog.data.priorityChanges} />

                {aiDialog.data.suggestedLetterBody ? (
                  <div className="rounded-2xl bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[17px] font-semibold">Suggested Letter Body</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-black/75">
                          {aiDialog.data.suggestedLetterBody}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setLetterBody(aiDialog.data?.suggestedLetterBody || '')
                          closeAiDialog()
                        }}
                        className="shrink-0 rounded-md bg-[#E7F12E] px-4 py-2 text-[14px] font-semibold text-black transition hover:opacity-95"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : aiDialog.mode === 'improve' && aiDialog.data ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white p-5">
                  <h4 className="text-[17px] font-semibold">Suggested Rewrite</h4>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-black/75">
                    {aiDialog.data.improvedText}
                  </p>
                </div>

                <AiListCard title="Why this helps" items={aiDialog.data.notes} />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeAiDialog}
                    className="rounded-md border border-black/10 px-4 py-2 text-[14px] font-semibold text-black/70 transition hover:bg-black/5"
                  >
                    Keep current text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      aiDialog.onApply?.(aiDialog.data?.improvedText || '')
                      closeAiDialog()
                    }}
                    className="rounded-md bg-[#E7F12E] px-4 py-2 text-[14px] font-semibold text-black transition hover:opacity-95"
                  >
                    Apply suggestion
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AiListCard({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null

  return (
    <div className="rounded-2xl bg-white p-5">
      <h4 className="text-[17px] font-semibold">{title}</h4>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-black/75">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

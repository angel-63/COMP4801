import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Sparkles, Trash2, WandSparkles, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { authFetch } from '../../lib/authApi'
import { fetchResumeDocument, saveResumeDocument, type ResumeDocument, type ResumeTargetJob } from '../../lib/resumeApi'
import { improveResumeTextWithAi, reviewResumeWithAi, type ResumeAiImproveResponse, type ResumeAiReviewResponse } from '../../lib/resumeAiApi'
import { getCurrentUserId } from '../../lib/profileApi'

type ResumeLink = {
  id: number
  label: string
  url: string
}

type EducationItem = {
  id: number
  institution: string
  degree: string
  startDate: string
  endDate: string
  fieldOfStudy: string
  description: string
}

type SkillItem = {
  id: number
  name: string
  proficiency: string
}

type ExperienceItem = {
  id: number
  title: string
  employer: string
  startDate: string
  endDate: string
  location: string
  description: string
}

type CertificateItem = {
  id: number
  name: string
}

type LanguageItem = {
  id: number
  language: string
  proficiency: string
}

type ResumeExportPayload = {
  meta: {
    resumeName: string
    exportFormat: 'pdf'
  }
  personal: {
    name: string
    phone: string
    location: string
    links: { label: string; url: string }[]
    summary: string
  }
  education: {
    institution: string
    degree: string
    startDate: string
    endDate: string
    fieldOfStudy: string
    bullets: string[]
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
    bullets: string[]
  }[]
  projects: {
    title: string
    employer: string
    startDate: string
    endDate: string
    location: string
    bullets: string[]
  }[]
  certificates: string[]
  languages: {
    language: string
    proficiency: string
  }[]
  sectionTitles: {
    personalDetails: string
    professionalSummary: string
    educations: string
    skills: string
    professionalExperiences: string
    projectExperiences: string
    certificates: string
    languages: string
  }
}

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
      {showPencil && (
        <Pencil
          size={16}
          className="opacity-0 transition group-hover:opacity-100"
        />
      )}
    </button>
  )
}

type ExperienceSectionProps = {
  title: string
  optional?: boolean
  roleLabel: string
  organizationLabel: string
  titlePlaceholder: string
  organizationPlaceholder: string
  addButtonLabel: string
  items: ExperienceItem[]
  onTitleChange: (value: string) => void
  onItemsChange: (items: ExperienceItem[]) => void
  onResetToProfile?: () => void
  onAiHelp?: (item: ExperienceItem) => void
}

function ExperienceSection({
  title,
  optional = false,
  roleLabel,
  organizationLabel,
  titlePlaceholder,
  organizationPlaceholder,
  addButtonLabel,
  items,
  onTitleChange,
  onItemsChange,
  onResetToProfile,
  onAiHelp,
}: ExperienceSectionProps) {
  return (
    <section className="rounded-md bg-[#666662] p-3">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <EditableHeading
            value={title}
            onChange={onTitleChange}
            className="text-[18px] font-semibold text-white"
            inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
          />
          {optional && (
            <span className="text-[12px] font-normal text-white/55">(Optional)</span>
          )}
        </div>

        <button
          type="button"
          onClick={onResetToProfile}
          className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
        >
          Reset to profile
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-[4px] bg-[#8A8983] p-2">
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] text-white/90">{roleLabel}</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, title: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder={titlePlaceholder}
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] text-white/90">{organizationLabel}</label>
                  <input
                    type="text"
                    value={item.employer}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, employer: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder={organizationPlaceholder}
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[120px_120px_1fr]">
                <div>
                  <label className="mb-1 block text-[12px] text-white/90">Start date</label>
                  <input
                    type="text"
                    value={item.startDate}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, startDate: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="MM/YYYY"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] text-white/90">End date</label>
                  <input
                    type="text"
                    value={item.endDate}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, endDate: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="MM/YYYY"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] text-white/90">Location</label>
                  <input
                    type="text"
                    value={item.location}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, location: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Location"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="mb-1 block text-[12px] text-white/90">Description</label>
                  <textarea
                    rows={4}
                    value={item.description}
                    onChange={(e) =>
                      onItemsChange(
                        items.map((x) =>
                          x.id === item.id ? { ...x, description: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="e.g., Conduct daily review of progress reports to ensure efficiency and contract compliance"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => onAiHelp?.(item)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border-[3px] border-[#E7F12E] px-4 py-1.5 text-[15px] font-medium text-[#E7F12E] transition hover:bg-[#E7F12E]/10"
                  >
                    <WandSparkles size={15} />
                    Get help with AI
                  </button>

                  <button
                    type="button"
                    onClick={() => onItemsChange(items.filter((x) => x.id !== item.id))}
                    className="mb-2 text-white/90 hover:text-[#E7F12E]"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            onItemsChange([
              ...items,
              {
                id: Date.now(),
                title: '',
                employer: '',
                startDate: '',
                endDate: '',
                location: '',
                description: '',
              },
            ])
          }
          className="w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
        >
          {addButtonLabel}
        </button>
      </div>
    </section>
  )
}

function visibleLinks(links: ResumeLink[]) {
  return links.filter((link) => link.label.trim() || link.url.trim())
}

function visibleSkills(skills: SkillItem[]) {
  return skills.filter((skill) => skill.name.trim())
}

function visibleExperiences(items: ExperienceItem[]) {
  return items.filter(
    (item) =>
      item.title.trim() ||
      item.employer.trim() ||
      item.location.trim() ||
      item.description.trim(),
  )
}

function visibleCertificates(items: CertificateItem[]) {
  return items.filter((item) => item.name.trim())
}

function visibleLanguages(items: LanguageItem[]) {
  return items.filter((item) => item.language.trim())
}

function hasEducationContent(item: EducationItem) {
  return Boolean(
    item.institution.trim() ||
      item.degree.trim() ||
      item.startDate.trim() ||
      item.endDate.trim() ||
      item.fieldOfStudy.trim() ||
      item.description.trim(),
  )
}

function visibleEducation(items: EducationItem[]) {
  return items.filter(hasEducationContent)
}

function hasNonEmptyText(value: string) {
  return Boolean(value.trim())
}

function splitDescriptionToBullets(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

type PreviewBlock =
  | { id: string; kind: 'profile'; estimatedHeight: number; content: string }
  | { id: string; kind: 'education'; estimatedHeight: number; item: EducationItem; location: string }
  | { id: string; kind: 'skills'; estimatedHeight: number; items: SkillItem[] }
  | {
      id: string
      kind: 'experience'
      estimatedHeight: number
      item: ExperienceItem
      sectionTitle: string
      showSectionHeading: boolean
    }
  | {
      id: string
      kind: 'project'
      estimatedHeight: number
      item: ExperienceItem
      sectionTitle: string
      showSectionHeading: boolean
    }
  | { id: string; kind: 'certificates'; estimatedHeight: number; items: CertificateItem[] }
  | { id: string; kind: 'languages'; estimatedHeight: number; items: LanguageItem[] }

function estimateLines(text: string, charsPerLine = 78) {
  if (!text.trim()) return 1
  return text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
}

const A4_PAGE_HEIGHT = 1123
const PREVIEW_PAGE_VERTICAL_PADDING = 96
const FIRST_PAGE_HEADER_RESERVE = 108
const FIRST_PAGE_CONTENT_CAPACITY = A4_PAGE_HEIGHT - PREVIEW_PAGE_VERTICAL_PADDING - FIRST_PAGE_HEADER_RESERVE
const OTHER_PAGE_CONTENT_CAPACITY = A4_PAGE_HEIGHT - PREVIEW_PAGE_VERTICAL_PADDING
const DEFAULT_PREVIEW_NAME = 'Your Name'
const APPLICATION_PREP_STORAGE_KEY = 'jobs:applicationPrep'

function getResumesStorageKey() {
  return `documents:resumes:${getCurrentUserId()}`
}

function getResumePrepStorageKey(resumeId: string) {
  return `documents:resumePrep:${getCurrentUserId()}:${resumeId}`
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

function getProfileNameFromStorage() {
  if (typeof window === 'undefined') return ''

  const candidateKeys = ['profileData', 'userProfile', 'profile', 'flashProfile']

  for (const key of candidateKeys) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      const parsed = JSON.parse(rawValue)
      const fullName = [parsed?.firstName, parsed?.lastName].filter(Boolean).join(' ').trim()
      const candidate =
        parsed?.name ??
        parsed?.fullName ??
        fullName ??
        parsed?.personalDetails?.name ??
        parsed?.personalDetails?.fullName ??
        ''

      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    } catch {
      if (rawValue.trim()) return rawValue.trim()
    }
  }

  return ''
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

function buildProfileLinks(profile: any): ResumeLink[] {
  if (!Array.isArray(profile?.links) || profile.links.length === 0) {
    return [{ id: 1, label: 'LinkedIn', url: 'linkedin.com/in/yourname' }]
  }

  return profile.links.map((link: Record<string, unknown>, index: number) => ({
    id: index + 1,
    label: String(link.label ?? link.site ?? ''),
    url: String(link.url ?? ''),
  }))
}

function buildProfileEducation(profile: any): EducationItem[] {
  if (!Array.isArray(profile?.education) || profile.education.length === 0) {
    return [
      {
        id: 1,
        institution: '',
        degree: '',
        startDate: '',
        endDate: '',
        fieldOfStudy: '',
        description: '',
      },
    ]
  }

  return profile.education.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    institution: String(item.institution ?? ''),
    degree: String(item.degree ?? ''),
    startDate: formatProfileMonthYear(item.startDate),
    endDate: formatProfileMonthYear(item.endDate),
    fieldOfStudy: String(item.fieldOfStudy ?? ''),
    description: '',
  }))
}

function buildProfileSkills(profile: any): SkillItem[] {
  if (!Array.isArray(profile?.skills) || profile.skills.length === 0) {
    return [{ id: 1, name: '', proficiency: 'Expert' }]
  }

  return profile.skills.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    name: String(item.skill ?? ''),
    proficiency: String(item.proficiency ?? 'Expert'),
  }))
}

function buildProfileExperiences(profile: any): ExperienceItem[] {
  if (!Array.isArray(profile?.workExperience) || profile.workExperience.length === 0) {
    return [
      {
        id: 1,
        title: '',
        employer: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      },
    ]
  }

  return profile.workExperience.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    title: String(item.position ?? ''),
    employer: String(item.company ?? ''),
    startDate: formatProfileMonthYear(item.startDate),
    endDate: formatProfileMonthYear(item.endDate),
    location: String(item.location ?? ''),
    description: '',
  }))
}

function buildProfileProjects(profile: any): ExperienceItem[] {
  if (!Array.isArray(profile?.projects) || profile.projects.length === 0) {
    return [
      {
        id: 1,
        title: '',
        employer: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
      },
    ]
  }

  return profile.projects.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    title: String(item.projectName ?? ''),
    employer: String(item.projectOwner ?? ''),
    startDate: formatProfileMonthYear(item.startDate),
    endDate: formatProfileMonthYear(item.endDate),
    location: String(item.location ?? ''),
    description: String(item.description ?? ''),
  }))
}

function buildProfileCertificates(profile: any): CertificateItem[] {
  if (!Array.isArray(profile?.certificates) || profile.certificates.length === 0) {
    return [{ id: 1, name: '' }]
  }

  return profile.certificates.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    name: String(item.name ?? ''),
  }))
}

function buildProfileLanguages(profile: any): LanguageItem[] {
  if (!Array.isArray(profile?.languages) || profile.languages.length === 0) {
    return [{ id: 1, language: '', proficiency: 'Native speaker' }]
  }

  return profile.languages.map((item: Record<string, unknown>, index: number) => ({
    id: index + 1,
    language: String(item.language ?? ''),
    proficiency: String(item.proficiency ?? 'Native speaker'),
  }))
}

function formatDocumentTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function syncStoredResumeMeta(resumeId: string, name: string, updatedAt: string) {
  if (typeof window === 'undefined') return

  const rawValue = window.localStorage.getItem(getResumesStorageKey())
  if (!rawValue) return

  try {
    const items = JSON.parse(rawValue) as Array<{ id: number; name: string; updatedAt: string }>
    const nextItems = items.map((item) =>
      String(item.id) === resumeId ? { ...item, name: name || item.name, updatedAt } : item,
    )

    window.localStorage.setItem(getResumesStorageKey(), JSON.stringify(nextItems))
  } catch {
    return
  }
}

type AiDialogState =
  | {
      mode: 'review'
      loading: boolean
      error: string | null
      data: ResumeAiReviewResponse | null
    }
  | {
      mode: 'improve'
      loading: boolean
      error: string | null
      data: ResumeAiImproveResponse | null
      onApply: ((text: string) => void) | null
      title: string
    }
  | null

function getStoredResumeMetaName(resumeId: string) {
  if (typeof window === 'undefined' || !resumeId) return ''

  const rawValue = window.localStorage.getItem(getResumesStorageKey())
  if (!rawValue) return ''

  try {
    const items = JSON.parse(rawValue) as Array<{ id: number; name: string }>
    const match = items.find((item) => String(item.id) === resumeId)
    return match?.name?.trim() || ''
  } catch {
    return ''
  }
}

function getApplicationPrepContext() {
  if (typeof window === 'undefined') return null

  const rawValue = window.localStorage.getItem(APPLICATION_PREP_STORAGE_KEY)
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

function getStoredResumePrepContext(resumeId: string) {
  if (typeof window === 'undefined' || !resumeId) return null

  const rawValue = window.localStorage.getItem(getResumePrepStorageKey(resumeId))
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

function clearApplicationPrepContext() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(APPLICATION_PREP_STORAGE_KEY)
}

function clearStoredResumePrepContext(resumeId: string) {
  if (typeof window === 'undefined' || !resumeId) return
  window.localStorage.removeItem(getResumePrepStorageKey(resumeId))
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
) {
  if (!prepContext || prepContext.mode !== 'resume') return undefined

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

function paginateBlocks(
  blocks: PreviewBlock[],
  measuredHeights: Record<string, number>,
  firstPageCapacity = FIRST_PAGE_CONTENT_CAPACITY,
  otherPageCapacity = OTHER_PAGE_CONTENT_CAPACITY,
) {
  const pages: PreviewBlock[][] = []
  let currentPage: PreviewBlock[] = []
  let currentHeight = 0
  let capacity = firstPageCapacity

  blocks.forEach((block) => {
    const blockHeight = measuredHeights[block.id] ?? block.estimatedHeight

    if (currentHeight + blockHeight > capacity && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = [block]
      currentHeight = blockHeight
      capacity = otherPageCapacity
    } else {
      currentPage.push(block)
      currentHeight += blockHeight
    }
  })

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages
}

export default function ResumeEditorPage() {
  const { id: resumeId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('Last saved at 26 Dec, 19:07')
  const [targetJob, setTargetJob] = useState<ResumeTargetJob | undefined>(undefined)
  const [aiDialog, setAiDialog] = useState<AiDialogState>(null)

  const [resumeName, setResumeName] = useState('Resume for Function A')
  const [profileName, setProfileName] = useState(DEFAULT_PREVIEW_NAME)

  const [sectionTitles, setSectionTitles] = useState({
    personalDetails: 'Personal Details',
    professionalSummary: 'Professional Summary',
    educations: 'Educations',
    skills: 'Skills',
    professionalExperiences: 'Professional Experiences',
    projectExperiences: 'Project Experiences',
    certificates: 'Certificates',
    languages: 'Languages',
  })

  const [skills, setSkills] = useState<SkillItem[]>([
    { id: 1, name: '', proficiency: 'Expert' },
  ])

  const [professionalExperiences, setProfessionalExperiences] = useState<ExperienceItem[]>([
    {
      id: 1,
      title: '',
      employer: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    },
  ])

  const [projectExperiences, setProjectExperiences] = useState<ExperienceItem[]>([
    {
      id: 1,
      title: '',
      employer: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    },
  ])

  const [certificates, setCertificates] = useState<CertificateItem[]>([
    { id: 1, name: '' },
  ])

  const [languages, setLanguages] = useState<LanguageItem[]>([
    { id: 1, language: '', proficiency: 'Native speaker' },
  ])

  const [education, setEducation] = useState<EducationItem[]>([
    {
      id: 1,
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
      fieldOfStudy: '',
      description: '',
    },
  ])

  const [links, setLinks] = useState<ResumeLink[]>([
    { id: 1, label: 'LinkedIn', url: 'linkedin.com/in/yourname' },
  ])

  const handleLinkChange = (
    id: number,
    field: keyof ResumeLink,
    value: string,
  ) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    )
  }

  const addNewLink = () => {
    setLinks((prev) => [
      ...prev,
      { id: Date.now(), label: '', url: '' },
    ])
  }

  const deleteLink = (id: number) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const previewLinks = visibleLinks(links)
  const previewSkills = visibleSkills(skills)
  const previewEducation = visibleEducation(education)
  const previewProfessionalExperiences = visibleExperiences(professionalExperiences)
  const previewProjectExperiences = visibleExperiences(projectExperiences)
  const previewCertificates = visibleCertificates(certificates)
  const previewLanguages = visibleLanguages(languages)
  const showSummary = hasNonEmptyText(summary)
  const showEducation = previewEducation.length > 0
  const showSkills = previewSkills.length > 0
  const showProfessionalExperiences = previewProfessionalExperiences.length > 0
  const showProjectExperiences = previewProjectExperiences.length > 0
  const showCertificates = previewCertificates.length > 0
  const showLanguages = previewLanguages.length > 0

  const [zoom, setZoom] = useState(0.80)
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const panOriginRef = useRef({ x: 0, y: 0 })
  const measurementRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [measuredBlockHeights, setMeasuredBlockHeights] = useState<Record<string, number>>({})

  useEffect(() => {
    const storedName = getProfileNameFromStorage()
    if (storedName) {
      setProfileName(storedName)
    }
  }, [])

  useEffect(() => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return

    const fullName = buildProfileDerivedName(profile)

    if (fullName) {
      setProfileName(fullName)
    }

    setPhone(typeof profile?.phone === 'string' ? profile.phone : '')
    setLocation(typeof profile?.location === 'string' ? profile.location : '')
    setLinks(buildProfileLinks(profile))
    setEducation(buildProfileEducation(profile))
    setSkills(buildProfileSkills(profile))
    setProfessionalExperiences(buildProfileExperiences(profile))
    setProjectExperiences(buildProfileProjects(profile))
    setCertificates(buildProfileCertificates(profile))
    setLanguages(buildProfileLanguages(profile))
  }, [])

  useEffect(() => {
    const prepContext = getApplicationPrepContext()
    const storedPrepContext = getStoredResumePrepContext(resumeId)
    const resolvedPrepContext =
      prepContext?.mode === 'resume' ? prepContext : storedPrepContext

    if (resolvedPrepContext?.mode !== 'resume') return

    setTargetJob(mapPrepContextToTargetJob(resolvedPrepContext))

    if (resolvedPrepContext.jobTitle?.trim()) {
      setResumeName(`Resume for ${resolvedPrepContext.jobTitle.trim()}`)
    }

    if (resolvedPrepContext.companyName?.trim()) {
      setSummary((prev) => {
        if (prev.trim()) return prev
        return `Tailored for ${resolvedPrepContext.jobTitle?.trim() || 'this role'} at ${(resolvedPrepContext.companyName || '').trim()}.`
      })
    }

    if (prepContext?.mode === 'resume') {
      clearApplicationPrepContext()
    }
  }, [resumeId])

  useEffect(() => {
    if (!resumeId) return

    const storedResumeName = getStoredResumeMetaName(resumeId)
    if (storedResumeName) {
      setResumeName(storedResumeName)
    }
  }, [resumeId])

  useEffect(() => {
    if (!resumeId) return

    const loadResume = async () => {
      try {
        const savedResume = await fetchResumeDocument(resumeId)

        setResumeName(savedResume.filename || 'Resume')
        setProfileName(savedResume.profileName || DEFAULT_PREVIEW_NAME)
        setPhone(savedResume.phone || '')
        setLocation(savedResume.location || '')
        setSummary(savedResume.summary || '')

        if (savedResume.sectionTitles) {
          setSectionTitles({
            personalDetails: savedResume.sectionTitles.personalDetails || 'Personal Details',
            professionalSummary: savedResume.sectionTitles.professionalSummary || 'Professional Summary',
            educations: savedResume.sectionTitles.educations || 'Educations',
            skills: savedResume.sectionTitles.skills || 'Skills',
            professionalExperiences:
              savedResume.sectionTitles.professionalExperiences || 'Professional Experiences',
            projectExperiences:
              savedResume.sectionTitles.projectExperiences || 'Project Experiences',
            certificates: savedResume.sectionTitles.certificates || 'Certificates',
            languages: savedResume.sectionTitles.languages || 'Languages',
          })
        }

        setLinks(
          savedResume.links?.length
            ? savedResume.links.map((link, index) => ({
                id: index + 1,
                label: link.label || '',
                url: link.url || '',
              }))
            : [{ id: 1, label: 'LinkedIn', url: 'linkedin.com/in/yourname' }],
        )

        setEducation(
          savedResume.education?.length
            ? savedResume.education.map((item, index) => ({
                id: index + 1,
                institution: item.institution || '',
                degree: item.degree || '',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
                fieldOfStudy: item.fieldOfStudy || '',
                description: item.description || '',
              }))
            : [
                {
                  id: 1,
                  institution: '',
                  degree: '',
                  startDate: '',
                  endDate: '',
                  fieldOfStudy: '',
                  description: '',
                },
              ],
        )

        setSkills(
          savedResume.skills?.length
            ? savedResume.skills.map((item, index) => ({
                id: index + 1,
                name: item.name || '',
                proficiency: item.proficiency || 'Expert',
              }))
            : [{ id: 1, name: '', proficiency: 'Expert' }],
        )

        setProfessionalExperiences(
          savedResume.experiences?.length
            ? savedResume.experiences.map((item, index) => ({
                id: index + 1,
                title: item.title || '',
                employer: item.employer || '',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
                location: item.location || '',
                description: item.description || '',
              }))
            : [
                {
                  id: 1,
                  title: '',
                  employer: '',
                  startDate: '',
                  endDate: '',
                  location: '',
                  description: '',
                },
              ],
        )

        setProjectExperiences(
          savedResume.projects?.length
            ? savedResume.projects.map((item, index) => ({
                id: index + 1,
                title: item.title || '',
                employer: item.employer || '',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
                location: item.location || '',
                description: item.description || '',
              }))
            : [
                {
                  id: 1,
                  title: '',
                  employer: '',
                  startDate: '',
                  endDate: '',
                  location: '',
                  description: '',
                },
              ],
        )

        setCertificates(
          savedResume.certificates?.length
            ? savedResume.certificates.map((name, index) => ({
                id: index + 1,
                name: name || '',
              }))
            : [{ id: 1, name: '' }],
        )

        setLanguages(
          savedResume.languages?.length
            ? savedResume.languages.map((item, index) => ({
                id: index + 1,
                language: item.language || '',
                proficiency: item.proficiency || 'Native speaker',
              }))
            : [{ id: 1, language: '', proficiency: 'Native speaker' }],
        )

        const fallbackPrepTargetJob = mapPrepContextToTargetJob(getStoredResumePrepContext(resumeId))
        setTargetJob(savedResume.targetJob ?? fallbackPrepTargetJob)

        if (savedResume.updatedAt) {
          const updatedDate = new Date(savedResume.updatedAt)
          if (!Number.isNaN(updatedDate.getTime())) {
            setSaveStatus(`Last saved at ${formatDocumentTimestamp(updatedDate)}`)
          }
        }
      } catch (loadError) {
        const storedResumeName = getStoredResumeMetaName(resumeId)
        if (storedResumeName) {
          setResumeName(storedResumeName)
        }

        if (!(loadError instanceof Error && loadError.message.includes('404'))) {
          console.error('Failed to load saved resume.', loadError)
        }
      }
    }

    void loadResume()
  }, [resumeId])

  const previewBlocks = useMemo<PreviewBlock[]>(() => {
    const blocks: PreviewBlock[] = []

    if (showSummary) {
      blocks.push({
        id: 'profile',
        kind: 'profile',
        estimatedHeight: 92 + estimateLines(summary) * 9,
        content: summary,
      })
    }

    if (showEducation) {
      previewEducation.forEach((item) => {
        blocks.push({
          id: `edu-${item.id}`,
          kind: 'education',
          estimatedHeight: 92 + estimateLines(item.description || '') * 12,
          item,
          location,
        })
      })
    }

    if (showSkills) {
      blocks.push({
        id: 'skills',
        kind: 'skills',
        estimatedHeight: 60 + Math.ceil(previewSkills.length / 2) * 22,
        items: previewSkills,
      })
    }

    if (showProfessionalExperiences) {
      previewProfessionalExperiences.forEach((item, index) => {
        blocks.push({
          id: `exp-${index}`,
          kind: 'experience',
          sectionTitle: sectionTitles.professionalExperiences,
          estimatedHeight: 76 + estimateLines(item.description || '') * 14,
          item,
          showSectionHeading: index === 0,
        })
      })
    }

    if (showProjectExperiences) {
      previewProjectExperiences.forEach((item, index) => {
        blocks.push({
          id: `proj-${index}`,
          kind: 'project',
          sectionTitle: sectionTitles.projectExperiences,
          estimatedHeight: 68 + estimateLines(item.description || '') * 14,
          item,
          showSectionHeading: index === 0,
        })
      })
    }

    if (showCertificates) {
      blocks.push({
        id: 'certificates',
        kind: 'certificates',
        estimatedHeight: 52 + previewCertificates.length * 20,
        items: previewCertificates,
      })
    }

    if (showLanguages) {
      blocks.push({
        id: 'languages',
        kind: 'languages',
        estimatedHeight: 52 + Math.ceil(previewLanguages.length / 2) * 22,
        items: previewLanguages,
      })
    }

    return blocks
  }, [
    summary,
    education,
    location,
    previewSkills,
    previewEducation,
    previewProfessionalExperiences,
    previewProjectExperiences,
    previewCertificates,
    previewLanguages,
    sectionTitles.professionalExperiences,
    sectionTitles.projectExperiences,
    showSummary,
    showEducation,
    showSkills,
    showProfessionalExperiences,
    showProjectExperiences,
    showCertificates,
    showLanguages,
  ])

  useLayoutEffect(() => {
    const nextHeights = previewBlocks.reduce<Record<string, number>>((acc, block) => {
      acc[block.id] = Math.ceil(
        (measurementRefs.current[block.id]?.getBoundingClientRect().height ??
          block.estimatedHeight) + 8,
      )
      return acc
    }, {})

    setMeasuredBlockHeights((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(nextHeights)
      const isSameLength = prevKeys.length === nextKeys.length
      const isSame =
        isSameLength &&
        nextKeys.every((key) => prev[key] === nextHeights[key])

      return isSame ? prev : nextHeights
    })
  }, [previewBlocks])

  const pagedPreviewBlocks = useMemo(() => {
    const pages = paginateBlocks(previewBlocks, measuredBlockHeights)
    return pages.length > 0 ? pages : [[]]
  }, [previewBlocks, measuredBlockHeights])

  useEffect(() => {
    if (currentPreviewPage > pagedPreviewBlocks.length - 1) {
      setCurrentPreviewPage(Math.max(0, pagedPreviewBlocks.length - 1))
    }
  }, [currentPreviewPage, pagedPreviewBlocks.length])

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

  const buildResumePayload = (): ResumeExportPayload => {
    const cleanedLinks = previewLinks.map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))

    const cleanedSkills = previewSkills.map((skill) => ({
      name: skill.name.trim(),
      proficiency: skill.proficiency.trim(),
    }))

    const cleanedExperiences = previewProfessionalExperiences.map((item) => ({
      title: item.title.trim(),
      employer: item.employer.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      location: item.location.trim(),
      bullets: splitDescriptionToBullets(item.description),
    }))

    const cleanedProjects = previewProjectExperiences.map((item) => ({
      title: item.title.trim(),
      employer: item.employer.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      location: item.location.trim(),
      bullets: splitDescriptionToBullets(item.description),
    }))

    return {
      meta: {
        resumeName: resumeName.trim(),
        exportFormat: 'pdf',
      },
      personal: {
        name: profileName.trim() || DEFAULT_PREVIEW_NAME,
        phone: phone.trim(),
        location: location.trim(),
        links: cleanedLinks,
        summary: summary.trim(),
      },
      education: previewEducation.map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        fieldOfStudy: item.fieldOfStudy.trim(),
        bullets: splitDescriptionToBullets(item.description),
      })),
      skills: cleanedSkills,
      experiences: cleanedExperiences,
      projects: cleanedProjects,
      certificates: previewCertificates.map((item) => item.name.trim()),
      languages: previewLanguages.map((item) => ({
        language: item.language.trim(),
        proficiency: item.proficiency.trim(),
      })),
      sectionTitles: { ...sectionTitles },
    }
  }

  const buildResumeDocument = (): ResumeDocument => ({
    filename: resumeName.trim() || 'Resume',
    profileName: profileName.trim() || DEFAULT_PREVIEW_NAME,
    phone: phone.trim(),
    location: location.trim(),
    links: previewLinks.map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    })),
    summary: summary.trim(),
    education: previewEducation.map((item) => ({
      institution: item.institution.trim(),
      degree: item.degree.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      fieldOfStudy: item.fieldOfStudy.trim(),
      description: item.description.trim(),
    })),
    skills: previewSkills.map((item) => ({
      name: item.name.trim(),
      proficiency: item.proficiency.trim(),
    })),
    experiences: previewProfessionalExperiences.map((item) => ({
      title: item.title.trim(),
      employer: item.employer.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      location: item.location.trim(),
      description: item.description.trim(),
    })),
    projects: previewProjectExperiences.map((item) => ({
      title: item.title.trim(),
      employer: item.employer.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      location: item.location.trim(),
      description: item.description.trim(),
    })),
    certificates: previewCertificates.map((item) => item.name.trim()),
    languages: previewLanguages.map((item) => ({
      language: item.language.trim(),
      proficiency: item.proficiency.trim(),
    })),
    sectionTitles: { ...sectionTitles },
    targetJob,
  })

  const handleSave = async () => {
    if (!resumeId || isSaving) return

    setIsSaving(true)

    try {
      const savedResume = await saveResumeDocument(resumeId, buildResumeDocument())
      const updatedAt = savedResume.updatedAt ? new Date(savedResume.updatedAt) : new Date()
      const formattedTimestamp = formatDocumentTimestamp(updatedAt)

      setResumeName(savedResume.filename || resumeName)
      setTargetJob(savedResume.targetJob ?? targetJob)
      setSaveStatus(`Last saved at ${formattedTimestamp}`)
      syncStoredResumeMeta(resumeId, savedResume.filename || resumeName, formattedTimestamp)
      if (savedResume.targetJob ?? targetJob) {
        clearStoredResumePrepContext(resumeId)
      }
    } catch (error) {
      console.error('Resume save failed.', error)
      window.alert(error instanceof Error ? error.message : 'Failed to save resume.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPersonalDetailsToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return

    const fullName = buildProfileDerivedName(profile)
    if (fullName) {
      setProfileName(fullName)
    }

    setPhone(typeof profile?.phone === 'string' ? profile.phone : '')
    setLocation(typeof profile?.location === 'string' ? profile.location : '')
    setLinks(buildProfileLinks(profile))
  }

  const handleResetEducationToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setEducation(buildProfileEducation(profile))
  }

  const handleResetSkillsToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setSkills(buildProfileSkills(profile))
  }

  const handleResetProfessionalExperiencesToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setProfessionalExperiences(buildProfileExperiences(profile))
  }

  const handleResetProjectsToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setProjectExperiences(buildProfileProjects(profile))
  }

  const handleResetCertificatesToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setCertificates(buildProfileCertificates(profile))
  }

  const handleResetLanguagesToProfile = () => {
    const profile = getProfileSnapshotFromStorage()
    if (!profile) return
    setLanguages(buildProfileLanguages(profile))
  }

  const closeAiDialog = () => setAiDialog(null)

  const handleReviewWithAi = async () => {
    const resumeDocument = buildResumeDocument()

    setAiDialog({
      mode: 'review',
      loading: true,
      error: null,
      data: null,
    })

    try {
      const result = await reviewResumeWithAi(resumeDocument)
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
        error: error instanceof Error ? error.message : 'Unable to review resume with AI.',
        data: null,
      })
    }
  }

  const runImproveWithAi = async (input: {
    title: string
    sectionType: string
    currentText: string
    itemTitle?: string
    itemSubtitle?: string
    onApply: (text: string) => void
  }) => {
    const resumeDocument = buildResumeDocument()

    setAiDialog({
      mode: 'improve',
      loading: true,
      error: null,
      data: null,
      onApply: input.onApply,
      title: input.title,
    })

    try {
      const result = await improveResumeTextWithAi(resumeDocument, {
        sectionType: input.sectionType,
        currentText: input.currentText,
        itemTitle: input.itemTitle,
        itemSubtitle: input.itemSubtitle,
      })

      setAiDialog({
        mode: 'improve',
        loading: false,
        error: null,
        data: result,
        onApply: input.onApply,
        title: input.title,
      })
    } catch (error) {
      setAiDialog({
        mode: 'improve',
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to improve this section with AI.',
        data: null,
        onApply: input.onApply,
        title: input.title,
      })
    }
  }

  const handleImproveSummaryWithAi = () =>
    void runImproveWithAi({
      title: 'Improve Summary',
      sectionType: 'summary',
      currentText: summary,
      itemTitle: profileName,
      itemSubtitle: targetJob?.jobTitle,
      onApply: setSummary,
    })

  const handleImproveEducationWithAi = (item: EducationItem) =>
    void runImproveWithAi({
      title: 'Improve Education Description',
      sectionType: 'education',
      currentText: item.description,
      itemTitle: item.institution,
      itemSubtitle: item.degree,
      onApply: (text) =>
        setEducation((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, description: text } : entry))),
    })

  const handleImproveExperienceWithAi = (item: ExperienceItem) =>
    void runImproveWithAi({
      title: 'Improve Experience Description',
      sectionType: 'experience',
      currentText: item.description,
      itemTitle: item.title,
      itemSubtitle: item.employer,
      onApply: (text) =>
        setProfessionalExperiences((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, description: text } : entry)),
        ),
    })

  const handleImproveProjectWithAi = (item: ExperienceItem) =>
    void runImproveWithAi({
      title: 'Improve Project Description',
      sectionType: 'project',
      currentText: item.description,
      itemTitle: item.title,
      itemSubtitle: item.employer,
      onApply: (text) =>
        setProjectExperiences((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, description: text } : entry)),
        ),
    })

  const handleBackToDocuments = () => {
    const shouldLeave = window.confirm(
      'Please make sure you save your resume before leaving. Go back to Documents anyway?',
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

  const handleExport = async () => {
    if (isExporting) return

    const payload = buildResumePayload()
    setIsExporting(true)

    try {
      const response = await authFetch('/api/resumes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type') || ''

        if (contentType.includes('application/json')) {
          const errorPayload = (await response.json()) as { message?: string; error?: string }
          throw new Error(errorPayload.message || errorPayload.error || 'Failed to export resume')
        }

        const message = await response.text()
        throw new Error(message || 'Failed to export resume')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `${payload.personal.name || 'resume'}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Resume export failed.', error)
      window.alert(error instanceof Error ? error.message : 'Resume export failed.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderPreviewBlock = (block: PreviewBlock) => {
    if (block.kind === 'profile') {
      return (
        <div key={block.id} className="mt-6">
          <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
            {sectionTitles.professionalSummary || 'Profile'}
          </div>
          <p className="mt-1 text-[16px] leading-[1.35]">{block.content}</p>
        </div>
      )
    }

    if (block.kind === 'education') {
      const dateRange = [block.item.startDate.trim(), block.item.endDate.trim()]
        .filter(Boolean)
        .join(' – ')
      const degreeLine = [block.item.degree.trim(), block.item.fieldOfStudy.trim()]
        .filter(Boolean)
        .join(' in ')
      const rightDetails = [location.trim(), dateRange].filter(Boolean).join(' · ')

      return (
        <div key={block.id} className="mt-5">
          <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
            {sectionTitles.educations || 'Education'}
          </div>

          <div className="mt-2 space-y-1">
            {(block.item.institution.trim() || block.item.endDate.trim()) && (
              <div className="flex items-start justify-between gap-4">
                <div className="font-bold">{block.item.institution}</div>
                {block.item.endDate.trim() && <div>{block.item.endDate}</div>}
              </div>
            )}

            {(degreeLine || rightDetails) && (
              <div className="flex items-start justify-between gap-4">
                <div className="italic">{degreeLine}</div>
                {rightDetails && <div className="italic">{rightDetails}</div>}
              </div>
            )}

            {splitDescriptionToBullets(block.item.description).length > 0 && (
              <ul className="mt-1 list-disc pl-8">
                {splitDescriptionToBullets(block.item.description).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    }

    if (block.kind === 'skills') {
      return (
        <div key={block.id} className="mt-5">
          <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
            {sectionTitles.skills || 'Skills'}
          </div>

          <div className="mt-2 grid grid-cols-4 gap-x-6 gap-y-1 text-[16px]">
            {block.items.map((skill) => (
              <div key={skill.id} className="contents">
                <div className="font-bold">{skill.name}</div>
                <div>{skill.proficiency}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (block.kind === 'experience') {
      const dateRange = [block.item.startDate.trim(), block.item.endDate.trim()]
        .filter(Boolean)
        .join(' – ')
      const descriptionLines = splitDescriptionToBullets(block.item.description)

      return (
        <div key={block.id} className={block.showSectionHeading ? 'mt-5' : 'mt-4'}>
          {block.showSectionHeading && (
            <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
              {block.sectionTitle || 'Experience'}
            </div>
          )}

          <div className="mt-2 space-y-1">
            {(block.item.employer.trim() || dateRange) && (
              <div className="flex items-start justify-between gap-4">
                <div className="font-bold">{block.item.employer}</div>
                {dateRange && <div>{dateRange}</div>}
              </div>
            )}

            {(block.item.title.trim() || block.item.location.trim()) && (
              <div className="flex items-start justify-between gap-4">
                <div className="italic">{block.item.title}</div>
                {block.item.location.trim() && <div className="italic">{block.item.location}</div>}
              </div>
            )}

            {descriptionLines.length > 0 && (
              <ul className="mt-1 list-disc pl-8">
                {descriptionLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    }

    if (block.kind === 'project') {
      const dateRange = [block.item.startDate.trim(), block.item.endDate.trim()]
        .filter(Boolean)
        .join(' – ')
      const descriptionLines = splitDescriptionToBullets(block.item.description)

      return (
        <div key={block.id} className={block.showSectionHeading ? 'mt-5' : 'mt-4'}>
          {block.showSectionHeading && (
            <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
              {block.sectionTitle || 'Projects'}
            </div>
          )}

          <div className="mt-2 space-y-1">
            {(block.item.title.trim() || dateRange) && (
              <div className="flex items-start justify-between gap-4">
                <div className="font-bold">{block.item.title}</div>
                {dateRange && <div>{dateRange}</div>}
              </div>
            )}

            {(block.item.employer.trim() || block.item.location.trim()) && (
              <div className="flex items-start justify-between gap-4 italic">
                <div>{block.item.employer}</div>
                {block.item.location.trim() && <div>{block.item.location}</div>}
              </div>
            )}

            {descriptionLines.length > 0 && (
              <ul className="mt-1 list-disc pl-8">
                {descriptionLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    }

    if (block.kind === 'certificates') {
      return (
        <div key={block.id} className="mt-5">
          <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
            {sectionTitles.certificates || 'Certificates'}
          </div>

          <ul className="mt-2 list-disc pl-8">
            {block.items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      )
    }

    return (
      <div key={block.id} className="mt-5">
        <div className="border-b border-black/70 pb-1 text-[18px] uppercase tracking-[0.02em]">
          {sectionTitles.languages || 'Languages'}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-x-6 gap-y-1 text-[16px]">
          {block.items.map((item) => (
            <div key={item.id} className="contents">
              <div className="font-bold">{item.language}</div>
              <div>{item.proficiency}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }



  const previewHeaderDetails = [
    phone.trim(),
    location.trim(),
    ...previewLinks.map((link) =>
      link.label && link.url ? `${link.label}: ${link.url}` : link.label || link.url,
    ),
  ].filter(Boolean)

  const previewHeader = (
    <div className="text-center">
      <h1 className="text-[34px] font-normal leading-none">
        {profileName.trim() || DEFAULT_PREVIEW_NAME}
      </h1>

      {previewHeaderDetails.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px]">
          {previewHeaderDetails.map((detail, index) => (
            <span key={`${detail}-${index}`}>{detail}</span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="relative min-h-screen bg-[#41413F] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#161616] px-4 py-5 md:px-6">
        <button type="button" onClick={handleBackToDocuments} className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
            Flash
          </span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </button>

        <div className="flex items-center gap-5">
          <p className="hidden text-[14px] text-white/80 md:block">
            {isSaving ? 'Saving resume...' : isExporting ? 'Exporting PDF...' : saveStatus}
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`rounded-md px-8 py-3 text-[18px] font-semibold text-black transition ${
              isSaving
                ? 'cursor-wait bg-[#D6D27A] opacity-90'
                : 'bg-[#E7F12E] hover:opacity-95'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`rounded-md px-8 py-3 text-[18px] font-semibold text-black transition ${
              isExporting
                ? 'cursor-wait bg-[#D6D27A] opacity-90'
                : 'bg-[#E7F12E] hover:opacity-95'
            }`}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0">
        <div
          className="bg-[#F4F1E8]"
          style={{
            width: '794px',
            fontFamily: '"Times New Roman", Times, serif',
          }}
        >
          <div className="px-12 py-12 text-[15px] leading-[1.35] text-black">
            {previewHeader}
            {previewBlocks.map((block) => (
              <div
                key={block.id}
                ref={(node) => {
                  measurementRefs.current[block.id] = node
                }}
              >
                {renderPreviewBlock(block)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="grid w-full items-start gap-6 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(620px,0.95fr)]">
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
              value={resumeName}
              onChange={setResumeName}
              className="text-[24px] font-semibold text-white hover:text-[#6F6DFF]"
              inputClassName="rounded bg-transparent px-1 text-[24px] font-semibold text-[#6F6DFF] outline-none ring-1 ring-[#6F6DFF]"
            />

            <button
              type="button"
              onClick={handleReviewWithAi}
              className="inline-flex items-center gap-2 rounded-full bg-[#E7F12E] px-5 py-2 text-[16px] font-medium text-black transition hover:opacity-95"
            >
              <Sparkles size={16} />
              Review with AI
            </button>
          </div>

          <div className="space-y-3">
            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <EditableHeading
                    value={sectionTitles.personalDetails}
                    onChange={(value) =>
                      setSectionTitles((prev) => ({ ...prev, personalDetails: value }))
                    }
                    className="text-[18px] font-semibold text-white"
                    inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                  />
                  <span className="text-[12px] font-normal text-white/55">(Optional)</span>
                </div>

                <button
                  type="button"
                  onClick={handleResetPersonalDetailsToProfile}
                  className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[14px] text-white/90">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[15px] text-black outline-none placeholder:text-black/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[14px] text-white/90">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[15px] text-black outline-none placeholder:text-black/40"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-[14px] text-white/90">
                  Links{' '}
                  <span className="ml-2 text-[12px] text-white/45">
                    e.g., LinkedIn, personal website
                  </span>
                </label>

                {links.map((link) => (
                  <div key={link.id} className="mb-2 rounded-[4px] bg-[#8A8983] p-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">Label</label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) =>
                            handleLinkChange(link.id, 'label', e.target.value)
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
                          onChange={(e) =>
                            handleLinkChange(link.id, 'url', e.target.value)
                          }
                          placeholder="URL"
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteLink(link.id)}
                        className="self-end pb-2 text-white/90 hover:text-[#E7F12E]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addNewLink}
                  className="mt-2 w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
                >
                  + Add new link
                </button>
              </div>
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <EditableHeading
                    value={sectionTitles.professionalSummary}
                    onChange={(value) =>
                      setSectionTitles((prev) => ({ ...prev, professionalSummary: value }))
                    }
                    className="text-[18px] font-semibold text-white"
                    inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                  />
                  <span className="text-[12px] font-normal text-white/55">(Optional)</span>
                </div>

                <button
                  type="button"
                  onClick={handleImproveSummaryWithAi}
                  className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#E7F12E] px-4 py-1.5 text-[15px] font-medium text-[#E7F12E] transition hover:bg-[#E7F12E]/10"
                >
                  <WandSparkles size={15} />
                  Get help with AI
                </button>
              </div>

              <textarea
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write 2 - 4 sentences about you: the role and what you did, the achievements, the motivations and skills"
                className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-3 text-[15px] text-black outline-none placeholder:text-black/40"
              />
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <EditableHeading
                  value={sectionTitles.educations}
                  onChange={(value) =>
                    setSectionTitles((prev) => ({ ...prev, educations: value }))
                  }
                  className="text-[18px] font-semibold text-white"
                  inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                />

                <button
                  type="button"
                  onClick={handleResetEducationToProfile}
                  className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="space-y-2">
                {education.map((item) => (
                  <div key={item.id} className="rounded-[4px] bg-[#8A8983] p-2">
                    <div className="grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">Institution</label>
                          <input
                            type="text"
                            value={item.institution}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, institution: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Institution name"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">Degree</label>
                          <input
                            type="text"
                            value={item.degree}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, degree: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Degree"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[120px_120px_1fr]">
                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">Start date</label>
                          <input
                            type="text"
                            value={item.startDate}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, startDate: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="MM/YYYY"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">End date</label>
                          <input
                            type="text"
                            value={item.endDate}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, endDate: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="MM/YYYY"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">Field of study</label>
                          <input
                            type="text"
                            value={item.fieldOfStudy}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, fieldOfStudy: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Field of study"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div>
                          <label className="mb-1 block text-[12px] text-white/90">Description</label>
                          <textarea
                            rows={4}
                            value={item.description}
                            onChange={(e) =>
                              setEducation((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, description: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="e.g., Graduated with honour, related courses"
                            className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                          />
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <button
                            type="button"
                            onClick={() => handleImproveEducationWithAi(item)}
                            className="mt-6 inline-flex items-center gap-2 rounded-full border-[3px] border-[#E7F12E] px-4 py-1.5 text-[15px] font-medium text-[#E7F12E] transition hover:bg-[#E7F12E]/10"
                          >
                            <WandSparkles size={15} />
                            Get help with AI
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEducation((prev) => prev.filter((x) => x.id !== item.id))
                            }
                            className="mb-2 text-white/90 hover:text-[#E7F12E]"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setEducation((prev) => [
                      ...prev,
                      {
                        id: Date.now(),
                        institution: '',
                        degree: '',
                        startDate: '',
                        endDate: '',
                        fieldOfStudy: '',
                        description: '',
                      },
                    ])
                  }
                  className="w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
                >
                  + Add new education
                </button>
              </div>
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <EditableHeading
                  value={sectionTitles.skills}
                  onChange={(value) =>
                    setSectionTitles((prev) => ({ ...prev, skills: value }))
                  }
                  className="text-[18px] font-semibold text-white"
                  inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                />

                <button
                  type="button"
                  onClick={handleResetSkillsToProfile}
                  className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="rounded-[4px] bg-[#8A8983] p-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">Skill</label>
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) =>
                            setSkills((prev) =>
                              prev.map((item) =>
                                item.id === skill.id ? { ...item, name: e.target.value } : item,
                              ),
                            )
                          }
                          placeholder="Skill"
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">
                          Proficiency - {skill.proficiency}
                        </label>
                        <select
                          value={skill.proficiency}
                          onChange={(e) =>
                            setSkills((prev) =>
                              prev.map((item) =>
                                item.id === skill.id
                                  ? { ...item, proficiency: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                          <option>Expert</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSkills((prev) => prev.filter((item) => item.id !== skill.id))
                        }
                        className="self-end pb-2 text-white/90 hover:text-[#E7F12E]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setSkills((prev) => [
                      ...prev,
                      { id: Date.now(), name: '', proficiency: 'Expert' },
                    ])
                  }
                  className="w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
                >
                  + Add new skill
                </button>
              </div>
            </section>

            <ExperienceSection
              title={sectionTitles.professionalExperiences}
              roleLabel="Job title"
              organizationLabel="Employer"
              titlePlaceholder="Job title"
              organizationPlaceholder="Employer"
              addButtonLabel="+ Add new experience"
              onTitleChange={(value) =>
                setSectionTitles((prev) => ({ ...prev, professionalExperiences: value }))
              }
              items={professionalExperiences}
              onItemsChange={setProfessionalExperiences}
              onResetToProfile={handleResetProfessionalExperiencesToProfile}
              onAiHelp={handleImproveExperienceWithAi}
            />

            <ExperienceSection
              title={sectionTitles.projectExperiences}
              optional
              roleLabel="Project name"
              organizationLabel="Employer"
              titlePlaceholder="Project name"
              organizationPlaceholder="Employer"
              addButtonLabel="+ Add new project"
              onTitleChange={(value) =>
                setSectionTitles((prev) => ({ ...prev, projectExperiences: value }))
              }
              items={projectExperiences}
              onItemsChange={setProjectExperiences}
              onResetToProfile={handleResetProjectsToProfile}
              onAiHelp={handleImproveProjectWithAi}
            />

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <EditableHeading
                    value={sectionTitles.certificates}
                    onChange={(value) =>
                      setSectionTitles((prev) => ({ ...prev, certificates: value }))
                    }
                    className="text-[18px] font-semibold text-white"
                    inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                  />
                  <span className="text-[12px] font-normal text-white/55">(Optional)</span>
                </div>

                <button
                  type="button"
                  onClick={handleResetCertificatesToProfile}
                  className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="space-y-2">
                {certificates.map((item) => (
                  <div key={item.id} className="rounded-[4px] bg-[#8A8983] p-2">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">Certificate name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            setCertificates((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)),
                            )
                          }
                          placeholder="Name"
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCertificates((prev) => prev.filter((x) => x.id !== item.id))
                        }
                        className="self-end pb-2 text-white/90 hover:text-[#E7F12E]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCertificates((prev) => [...prev, { id: Date.now(), name: '' }])
                  }
                  className="w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
                >
                  + Add new certificate
                </button>
              </div>
            </section>

            <section className="rounded-md bg-[#666662] p-3">
              <div className="mb-3 flex items-start justify-between gap-4">
                <EditableHeading
                  value={sectionTitles.languages}
                  onChange={(value) =>
                    setSectionTitles((prev) => ({ ...prev, languages: value }))
                  }
                  className="text-[18px] font-semibold text-white"
                  inputClassName="rounded bg-transparent px-1 text-[18px] font-semibold text-white outline-none ring-1 ring-white/40"
                />

                <button
                  type="button"
                  onClick={handleResetLanguagesToProfile}
                  className="rounded-md bg-[#E7F12E] px-3 py-1 text-[13px] font-medium text-black transition hover:opacity-95"
                >
                  Reset to profile
                </button>
              </div>

              <div className="space-y-2">
                {languages.map((item) => (
                  <div key={item.id} className="rounded-[4px] bg-[#8A8983] p-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">Language</label>
                        <input
                          type="text"
                          value={item.language}
                          onChange={(e) =>
                            setLanguages((prev) =>
                              prev.map((x) =>
                                x.id === item.id ? { ...x, language: e.target.value } : x,
                              ),
                            )
                          }
                          placeholder="Language"
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[12px] text-white/90">
                          Proficiency - {item.proficiency}
                        </label>
                        <select
                          value={item.proficiency}
                          onChange={(e) =>
                            setLanguages((prev) =>
                              prev.map((x) =>
                                x.id === item.id
                                  ? { ...x, proficiency: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="w-full rounded-[4px] bg-[#F0EFEA] px-3 py-2 text-[14px] text-black outline-none"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                          <option>Native speaker</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setLanguages((prev) => prev.filter((x) => x.id !== item.id))
                        }
                        className="self-end pb-2 text-white/90 hover:text-[#E7F12E]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setLanguages((prev) => [
                      ...prev,
                      { id: Date.now(), language: '', proficiency: 'Native speaker' },
                    ])
                  }
                  className="w-full text-center text-[14px] text-white/85 transition hover:text-[#E7F12E]"
                >
                  + Add new language
                </button>
              </div>
            </section>
          </div>
        </section>

        <section className="min-w-0 self-start xl:sticky xl:top-30">
          <div className="relative flex h-[820px] flex-col overflow-hidden sticky top-20 h-[85vh] min-h-[700px] rounded-xl border border-white/10 bg-[#5B5A56] shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
            {/* Viewer toolbar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#666662] px-4 py-3 text-white">
              <div className="text-sm font-medium">
                Preview
              </div>

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

            {/* Viewer area */}
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
                {pagedPreviewBlocks.map((pageBlocks, pageIndex) => (
                  <div
                    key={pageIndex}
                    className={`${pageIndex === currentPreviewPage ? 'block' : 'hidden'} mb-8 rounded-[2px] bg-[#F4F1E8] shadow-[0_12px_30px_rgba(0,0,0,0.28)]`}
                    style={{
                      width: '794px',
                      minHeight: '1123px',
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >
                    <div className="px-12 py-12 text-[15px] leading-[1.35] text-black">
                      {pageIndex === 0 && previewHeader}

                      {pageBlocks.map((block) => renderPreviewBlock(block))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-[#3C3B39]/90 px-5 py-2 text-[18px] text-white backdrop-blur">
              <button
                type="button"
                onClick={() => setCurrentPreviewPage((prev) => Math.max(0, prev - 1))}
                className="opacity-90 hover:opacity-100"
              >
                ‹
              </button>
              <span>
                {pagedPreviewBlocks.length === 0 ? 0 : currentPreviewPage + 1} / {Math.max(1, pagedPreviewBlocks.length)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPreviewPage((prev) =>
                    Math.min(Math.max(0, pagedPreviewBlocks.length - 1), prev + 1),
                  )
                }
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
                  {aiDialog.mode === 'review' ? 'AI Resume Review' : aiDialog.title}
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
                AI is reviewing your resume...
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

                {aiDialog.data.tailoredSummary ? (
                  <div className="rounded-2xl bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[17px] font-semibold">Suggested Summary</h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-black/75">
                          {aiDialog.data.tailoredSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSummary(aiDialog.data?.tailoredSummary || '')
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

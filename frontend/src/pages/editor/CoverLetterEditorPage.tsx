import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Trash2, WandSparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

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

const COVER_LETTERS_STORAGE_KEY = 'documents:coverLetters'
const DEFAULT_PROFILE_NAME = 'Your Name'

function getDetailStorageKey(id: string) {
  return `documents:coverLetter:${id}`
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

  const rawValue = window.localStorage.getItem(COVER_LETTERS_STORAGE_KEY)
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

function buildExportText({
  profileName,
  phone,
  location,
  links,
  companyName,
  hiringManagerName,
  letterBody,
}: Pick<
  CoverLetterDraft,
  'profileName' | 'phone' | 'location' | 'links' | 'companyName' | 'hiringManagerName' | 'letterBody'
>) {
  const details = [
    profileName.trim(),
    phone.trim(),
    location.trim(),
    ...visibleLinks(links).map((link) =>
      link.label.trim() && link.url.trim()
        ? `${link.label.trim()}: ${link.url.trim()}`
        : link.label.trim() || link.url.trim(),
    ),
  ].filter(Boolean)

  const paragraphs = letterBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return [
    ...details,
    '',
    formatTimestamp(new Date()),
    '',
    companyName.trim(),
    hiringManagerName.trim(),
    '',
    `Dear ${hiringManagerName.trim() || 'Hiring Manager'},`,
    '',
    ...(paragraphs.length > 0 ? paragraphs.flatMap((paragraph) => [paragraph, '']) : []),
    'Sincerely,',
    profileName.trim() || DEFAULT_PROFILE_NAME,
  ].join('\n')
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
  const [coverLetterName, setCoverLetterName] = useState('Cover letter for Function A')
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME)
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [links, setLinks] = useState<CoverLetterLink[]>([{ id: 1, label: '', url: '' }])
  const [companyName, setCompanyName] = useState('')
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [letterBody, setLetterBody] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState('')
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0)

  useEffect(() => {
    const documents = readCoverLetterDocuments()
    const documentMeta = documents.find((item) => String(item.id) === id)
    const fallbackName = documentMeta?.name || 'Cover letter for Function A'
    const draft = readCoverLetterDraft(id, fallbackName)

    setCoverLetterName(draft.coverLetterName || fallbackName)
    setProfileName(draft.profileName || DEFAULT_PROFILE_NAME)
    setPhone(draft.phone || '')
    setLocation(draft.location || '')
    setLinks(draft.links.length > 0 ? draft.links : [{ id: 1, label: '', url: '' }])
    setCompanyName(draft.companyName || '')
    setHiringManagerName(draft.hiringManagerName || '')
    setLetterBody(draft.letterBody || '')
    setLastSavedAt(draft.lastSavedAt || documentMeta?.updatedAt || '')
  }, [id])

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
    const timestamp = formatTimestamp()
    const normalizedName = coverLetterName.trim() || 'Untitled cover letter'
    const draft: CoverLetterDraft = {
      coverLetterName: normalizedName,
      profileName: profileName.trim() || DEFAULT_PROFILE_NAME,
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

    window.localStorage.setItem(COVER_LETTERS_STORAGE_KEY, JSON.stringify(nextDocuments))
    setCoverLetterName(normalizedName)
    setLastSavedAt(timestamp)
  }

  const handleExport = () => {
    const text = buildExportText({
      profileName: profileName.trim() || DEFAULT_PROFILE_NAME,
      phone,
      location,
      links,
      companyName,
      hiringManagerName,
      letterBody,
    })

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = `${sanitizeFilename(coverLetterName)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(blobUrl)
  }

  return (
    <div className="relative min-h-screen bg-[#41413F] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#161616] px-4 py-5 md:px-6">
        <Link to="/documents" className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
            Flash
          </span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </Link>

        <div className="flex items-center gap-4 md:gap-5">
          <p className="hidden text-[14px] text-white/80 md:block">
            {lastSavedAt ? `Last saved at ${lastSavedAt}` : 'Not saved yet'}
          </p>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[#FBF54A] px-6 py-3 text-[18px] font-semibold text-black transition hover:opacity-95 md:px-8"
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-[#FBF54A] px-6 py-3 text-[18px] font-semibold text-black transition hover:opacity-95 md:px-8"
          >
            Export
          </button>
        </div>
      </header>

      <main className="grid w-full items-start gap-5 px-6 py-4 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <section className="min-w-0">
          <Link
            to="/documents"
            className="mb-4 inline-flex items-center gap-2 text-[14px] text-white/85 transition hover:text-white"
          >
            <ChevronLeft size={18} />
            Back
          </Link>

          <div className="mb-4 flex items-center justify-between gap-4">
            <input
              type="text"
              value={coverLetterName}
              onChange={(event) => setCoverLetterName(event.target.value)}
              className="w-full bg-transparent text-[24px] font-semibold text-white outline-none placeholder:text-white/60"
              placeholder="Cover letter name"
            />

            <button className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FBF54A] px-5 py-2 text-[16px] font-medium text-black transition hover:opacity-95">
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

                <button className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#FBF54A] px-4 py-1.5 text-[15px] font-medium text-[#FBF54A] transition hover:bg-[#FBF54A]/10">
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

        <section className="min-w-0 xl:sticky xl:top-24">
          <div className="flex min-h-[740px] flex-col items-center bg-transparent">
            <div
              className="w-full max-w-[580px] rounded-[2px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
              style={{
                minHeight: '730px',
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >
              <div className="px-14 py-14 text-[15px] leading-[1.5] text-black">
                <header className="mb-10">
                  <h1 className="text-[30px] font-semibold leading-none text-black">
                    {profileName.trim() || DEFAULT_PROFILE_NAME}
                  </h1>

                  {previewDetails.length > 0 && (
                    <div className="mt-3 space-y-1 text-[13px] text-black/75">
                      {previewDetails.map((detail, index) => (
                        <div key={`${detail}-${index}`}>{detail}</div>
                      ))}
                    </div>
                  )}
                </header>

                <div className="space-y-5">
                  <p>{formatTimestamp(new Date())}</p>

                  {(companyName.trim() || hiringManagerName.trim()) && (
                    <div className="space-y-1">
                      {companyName.trim() && <p>{companyName.trim()}</p>}
                      {hiringManagerName.trim() && <p>{hiringManagerName.trim()}</p>}
                    </div>
                  )}

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

            <div className="mt-4 flex items-center gap-4 rounded-full bg-[#3C3B39] px-5 py-2 text-[18px] text-white">
              <button
                type="button"
                onClick={() => setCurrentPreviewPage(0)}
                className="opacity-90 transition hover:opacity-100"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span>{currentPreviewPage + 1} / 1</span>
              <button
                type="button"
                onClick={() => setCurrentPreviewPage(0)}
                className="opacity-90 transition hover:opacity-100"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

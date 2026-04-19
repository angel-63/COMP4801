import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, FileText, FileType, Trash2 } from 'lucide-react'

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
const RESUMES_STORAGE_KEY = 'documents:resumes'
const COVER_LETTERS_STORAGE_KEY = 'documents:coverLetters'

const defaultResumeData: ResumeItem[] = [
  {
    id: 1,
    name: 'Resume name',
    updatedAt: '26 Dec, 19:07',
  },
]

const defaultCoverLetterData: CoverLetterItem[] = [
  {
    id: 1,
    name: 'Cover letter 1',
    createdAt: '28 Dec 2025, 20:27',
    updatedAt: '28 Dec 2025, 20:27',
  },
  {
    id: 2,
    name: 'Cover letter 2',
    createdAt: '28 Dec 2025, 20:27',
    updatedAt: '28 Dec 2025, 20:27',
  },
]

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

function getNextDocumentName(items: { name: string }[], baseName: string) {
  let candidateNumber = items.length + 1
  let candidate = `${baseName} ${candidateNumber}`

  while (items.some((item) => item.name === candidate)) {
    candidateNumber += 1
    candidate = `${baseName} ${candidateNumber}`
  }

  return candidate
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('resume')
  const [resumes, setResumes] = useState<ResumeItem[]>(() =>
    readStoredItems(RESUMES_STORAGE_KEY, defaultResumeData),
  )
  const [coverLetters, setCoverLetters] = useState<CoverLetterItem[]>(() =>
    readStoredItems(COVER_LETTERS_STORAGE_KEY, defaultCoverLetterData),
  )
  const [selectedResumeId, setSelectedResumeId] = useState<number>(
    () => readStoredItems(RESUMES_STORAGE_KEY, defaultResumeData)[0]?.id ?? 1,
  )

  useEffect(() => {
    window.localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(resumes))
  }, [resumes])

  useEffect(() => {
    window.localStorage.setItem(COVER_LETTERS_STORAGE_KEY, JSON.stringify(coverLetters))
  }, [coverLetters])

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
    const nextResume: ResumeItem = {
      id,
      name: getNextDocumentName(resumes, 'Resume'),
      updatedAt: formatTimestamp(),
    }

    setResumes((prev) => [...prev, nextResume])
    setSelectedResumeId(id)
  }

  const handleDeleteResume = (id: number) => {
    setResumes((prev) => prev.filter((item) => item.id !== id))
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
                  <button
                    type="button"
                    onClick={() => setSelectedResumeId(item.id)}
                    className={`flex w-full gap-4 text-left transition ${
                      isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="h-[170px] w-[120px] shrink-0 bg-[#EFEFEF]" />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[18px] font-semibold">{item.name}</h2>
                      <p className="mt-1 text-[13px] text-white/60">
                        Updated on {item.updatedAt}
                      </p>

                      <div className="my-2 h-px bg-white/15" />

                      <div className="space-y-4 pt-2 text-[14px] text-white/85">
                        <div className="flex items-center gap-3 transition hover:text-[#E7F12E]">
                          <Copy size={18} />
                          <span>Make a copy</span>
                        </div>

                        <div className="flex items-center gap-3 transition hover:text-[#E7F12E]">
                          <FileText size={18} />
                          <span>Export as pdf</span>
                        </div>

                        <div className="flex items-center gap-3 transition hover:text-[#E7F12E]">
                          <FileType size={18} />
                          <span>Export as docx</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <Link
                    to={`/documents/resume/${item.id}`}
                    className="block w-full rounded-md bg-[#E7F12E] px-5 py-3 text-center text-[16px] font-semibold text-black transition hover:opacity-95"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteResume(item.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border-[3px] border-[#E63B3B] px-5 py-3 text-[16px] font-semibold text-[#E63B3B] transition hover:bg-[#E63B3B]/10"
                  >
                    <Trash2 size={18} />
                    Delete
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

            {!canCreateResume && resumes.length === 0 && (
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

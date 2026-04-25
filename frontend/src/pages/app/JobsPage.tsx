import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react'
import { fetchJobById, searchJobs } from '../../lib/jobsApi'
import { authFetch } from '../../lib/authApi'
import { getCurrentUserEmail, getCurrentUserId } from '../../lib/profileApi'
import { listResumeDocuments } from '../../lib/resumeApi'
import { readSavedJobs, subscribeToSavedJobs, toggleSavedJob } from '../../lib/savedJobs'
import type { JobSummary } from '../../types/job'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchCurrentUserProfile, getCachedUserProfile } from '../../lib/profileApi'
import type { UserProfile } from '../../types/profile'

const JOBS_PER_PAGE = 20
const APPLICATION_PREP_STORAGE_KEY = 'jobs:applicationPrep'
const MAX_DOCUMENTS_PER_TYPE = 3

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'fulltime' },
  { label: 'Part-time', value: 'parttime' },
  { label: 'Internship', value: 'internship' },
  { label: 'Contract', value: 'contract' },
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { label: 'Internship', value: 'internship' },
  { label: 'Junior', value: 'entry level' },
  { label: 'Mid', value: 'associate' },
  { label: 'Senior', value: 'mid-senior level' },
]

const JOB_FUNCTION_OPTIONS = [
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Design', value: 'Design' },
  { label: 'Business', value: 'Business' },
  { label: 'Product', value: 'Product' },
  { label: 'Marketing', value: 'Marketing' },
]

const INDUSTRY_OPTIONS = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Media', value: 'Media' },
  { label: 'Consulting', value: 'Consulting' },
]

const JOB_MODE_OPTIONS = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'on-site' },
]

const DATE_POSTED_OPTIONS = [
  { label: 'Last 24 hours', value: 'Last 24 hours' },
  { label: 'Last 7 days', value: 'Last 7 days' },
  { label: 'Last 30 days', value: 'Last 30 days' },
]

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Newest', value: 'postedAt' },
]

function getCoverLettersStorageKey() {
  return `documents:coverLetters:${getCurrentUserId()}`
}

function getResumesStorageKey() {
  return `documents:resumes:${getCurrentUserId()}`
}

function readStoredDocumentCount(storageKey: string) {
  if (typeof window === 'undefined') return 0

  const rawValue = window.localStorage.getItem(storageKey)
  if (!rawValue) return 0

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

type RecommendationScoreMap = Record<string, number>

export default function JobsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const requestedSavedJobId = useMemo(
    () => new URLSearchParams(location.search).get('savedJobId'),
    [location.search],
  )
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSortBy, setSelectedSortBy] = useState<'recommended' | 'postedAt'>('postedAt')
  const [recommendationScores, setRecommendationScores] = useState<RecommendationScoreMap>({})

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('')
  const [selectedJobMode, setSelectedJobMode] = useState('')
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedJobFunction, setSelectedJobFunction] = useState('')
  const [selectedDatePosted, setSelectedDatePosted] = useState('')
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(() => getCachedUserProfile())
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (requestedSavedJobId) {
      setSelectedJobId(requestedSavedJobId)
    }
  }, [requestedSavedJobId])

  useEffect(() => {
    const syncSavedJobs = async () => {
      const items = await readSavedJobs()
      setSavedJobIds(items.map((job) => job.id))
    }

    void syncSavedJobs()
    return subscribeToSavedJobs(() => {
      void syncSavedJobs()
    })
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(await fetchCurrentUserProfile())
      } catch {
        const cachedProfile = getCachedUserProfile()
        if (cachedProfile) {
          setProfile(cachedProfile)
        }
      }
    }

    void loadProfile()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    if (selectedSortBy !== 'recommended') {
      return
    }

    const loadRecommendationScores = async () => {
      setIsRecommendationsLoading(true)

      try {
        const email = getCurrentUserEmail()
        const userId = getCurrentUserId()
        const query = new URLSearchParams()

        if (email) {
          query.set('email', email)
        } else if (userId) {
          query.set('userId', userId)
        }

        const response = await authFetch(`/api/jobs/recommendations?${query.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to load recommendation scores: ${response.status}`)
        }

        const payload = (await response.json()) as Array<{
          job?: { id?: string }
          scores?: { jobId?: string; combinedScore?: number }
        }>

        const nextScores = payload.reduce<RecommendationScoreMap>((accumulator, item) => {
          const jobId = item.scores?.jobId || item.job?.id
          const combinedScore = item.scores?.combinedScore

          if (jobId && typeof combinedScore === 'number') {
            accumulator[jobId] = combinedScore
          }

          return accumulator
        }, {})

        setRecommendationScores(nextScores)
      } catch (recommendationError) {
        console.error(recommendationError)
        setRecommendationScores({})
      } finally {
        setIsRecommendationsLoading(false)
      }
    }

    void loadRecommendationScores()
  }, [selectedSortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    selectedEmploymentType,
    selectedJobMode,
    selectedExperienceLevel,
    selectedIndustry,
    selectedCompany,
    selectedJobFunction,
    selectedDatePosted,
  ])

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await searchJobs({
          keyword: searchTerm,
          employmentType: selectedEmploymentType,
          jobMode: selectedJobMode,
          experienceLevel: selectedExperienceLevel,
          industry: selectedIndustry,
          company: selectedCompany,
          jobFunction: selectedJobFunction,
          hours: mapDatePostedToHours(selectedDatePosted),
          page: currentPage - 1,
          size: JOBS_PER_PAGE,
          sortBy: 'postedAt',
          direction: 'desc',
        })
        const nextJobs =
          selectedSortBy === 'recommended'
            ? sortJobsByRecommendation(response.content, recommendationScores)
            : response.content

        setJobs(nextJobs)
        setTotalPages(Math.max(response.totalPages || 0, 1))
        setTotalResults(response.totalElements || response.content.length)

        setSelectedJobId((currentSelectedJobId) => {
          if (requestedSavedJobId) {
            return requestedSavedJobId
          }

          return currentSelectedJobId ?? response.content[0]?.id ?? null
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs')
        setJobs([])
        setSelectedJobId(null)
        setSelectedJob(null)
        setTotalPages(1)
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobs()
  }, [
    currentPage,
    searchTerm,
    selectedEmploymentType,
    selectedJobMode,
    selectedExperienceLevel,
    selectedIndustry,
    selectedCompany,
    selectedJobFunction,
    selectedDatePosted,
    selectedSortBy,
    recommendationScores,
    requestedSavedJobId,
  ])

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null)
      return
    }

    const fallbackJob = jobs.find((job) => job.id === selectedJobId) ?? null
    setSelectedJob(fallbackJob)

    const loadJobDetail = async () => {
      setIsDetailLoading(true)

      try {
        const detail = await fetchJobById(selectedJobId)
        setSelectedJob(detail)
      } catch {
        setSelectedJob(fallbackJob)
      } finally {
        setIsDetailLoading(false)
      }
    }

    void loadJobDetail()
  }, [jobs, selectedJobId])

  const pageNumbers = useMemo(() => buildPageNumbers(currentPage, totalPages), [currentPage, totalPages])
  const profileTagMatcher = useMemo(() => buildProfileTagMatcher(profile), [profile])

  const toggleSaved = async (job: JobSummary) => {
    const nextItems = await toggleSavedJob({
      id: job.id,
      title: job.jobTitle || 'Untitled role',
      companyName: job.companyName || 'Unknown company',
      employmentType: job.employmentType || '',
      jobMode: job.jobMode || '',
      experienceLevel: job.experienceLevel || '',
      description: job.jobDescription || '',
      tags: [
        ...(job.companyIndustry || []),
        ...(job.jobFunction || []),
        ...(job.skillTags || []),
      ].filter(Boolean),
      companyLogoDataUrl: job.companyLogoDataUrl,
      applicationUrl: job.applicationUrl,
      originalSourceSite: job.originalSourceSite,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      savedAt: new Date().toISOString(),
      source: 'jobs',
    })
    setSavedJobIds(nextItems.map((item) => item.id))
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedEmploymentType('')
    setSelectedJobMode('')
    setSelectedExperienceLevel('')
    setSelectedIndustry('')
    setSelectedCompany('')
    setSelectedJobFunction('')
    setSelectedDatePosted('')
  }

  const openApplyModal = () => {
    setCopyStatus(null)
    setIsApplyModalOpen(true)
  }

  const closeApplyModal = () => {
    setIsApplyModalOpen(false)
    setCopyStatus(null)
  }

  const storeApplicationPrepContext = (mode: 'resume' | 'cover-letter') => {
    if (typeof window === 'undefined' || !selectedJob) return

    window.localStorage.setItem(
      APPLICATION_PREP_STORAGE_KEY,
      JSON.stringify({
        mode,
        jobId: selectedJob.id,
        jobTitle: selectedJob.jobTitle || '',
        companyName: selectedJob.companyName || '',
        employmentType: selectedJob.employmentType || '',
        jobMode: selectedJob.jobMode || '',
        experienceLevel: selectedJob.experienceLevel || '',
        jobDescription: selectedJob.jobDescription || '',
        applicationUrl: selectedJob.applicationUrl || '',
        skillTags: selectedJob.skillTags || [],
        savedAt: new Date().toISOString(),
      }),
    )
  }

  const handlePrepareResume = () => {
    void (async () => {
      try {
        const resumes = await listResumeDocuments()
        if (resumes.length >= MAX_DOCUMENTS_PER_TYPE) {
          setCopyStatus('Resume limit reached (3/3). Delete an existing resume to create a new one.')
          return
        }
      } catch {
        const cachedCount = readStoredDocumentCount(getResumesStorageKey())
        if (cachedCount >= MAX_DOCUMENTS_PER_TYPE) {
          setCopyStatus('Resume limit reached (3/3). Delete an existing resume to create a new one.')
          return
        }
      }

      storeApplicationPrepContext('resume')
      closeApplyModal()
      navigate('/documents')
    })()
  }

  const handlePrepareCoverLetter = () => {
    const coverLetterCount = readStoredDocumentCount(getCoverLettersStorageKey())
    if (coverLetterCount >= MAX_DOCUMENTS_PER_TYPE) {
      setCopyStatus('Cover letter limit reached (3/3). Delete an existing cover letter to create a new one.')
      return
    }

    storeApplicationPrepContext('cover-letter')
    closeApplyModal()
    navigate('/documents')
  }

  const handleCopyApplicationLink = async () => {
    if (!selectedJob?.applicationUrl) {
      setCopyStatus('No application link is available for this job.')
      return
    }

    try {
      await navigator.clipboard.writeText(selectedJob.applicationUrl)
      setCopyStatus('Application link copied.')
    } catch {
      setCopyStatus('Unable to copy the application link.')
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="grid grid-cols-[520px_minmax(0,1fr)] items-start gap-10">
        <div>
          <h2 className="mb-3 text-[24px] font-semibold text-white">Search</h2>
          <input
            type="text"
            placeholder="Enter title, skills or company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-[#F0EFEA] px-6 py-4 text-[16px] text-black outline-none placeholder:text-black/45"
          />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[24px] font-semibold text-white">Filters</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-white/65 transition hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 pr-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent">
            <FilterSelect
              label="Date posted"
              value={selectedDatePosted}
              onChange={setSelectedDatePosted}
              options={DATE_POSTED_OPTIONS}
            />
            <FilterSelect
              label="Employment type"
              value={selectedEmploymentType}
              onChange={setSelectedEmploymentType}
              options={EMPLOYMENT_TYPE_OPTIONS}
            />
            <FilterSelect
              label="Experience level"
              value={selectedExperienceLevel}
              onChange={setSelectedExperienceLevel}
              options={EXPERIENCE_LEVEL_OPTIONS}
            />
            <FilterSelect
              label="Job function"
              value={selectedJobFunction}
              onChange={setSelectedJobFunction}
              options={JOB_FUNCTION_OPTIONS}
            />
            <FilterSelect
              label="Industry"
              value={selectedIndustry}
              onChange={setSelectedIndustry}
              options={INDUSTRY_OPTIONS}
            />
            <FilterInput
              label="Company"
              value={selectedCompany}
              onChange={setSelectedCompany}
            />
            <FilterSelect
              label="Job mode"
              value={selectedJobMode}
              onChange={setSelectedJobMode}
              options={JOB_MODE_OPTIONS}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_2.05fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[16px] text-white/85">
              Showing {jobs.length === 0 ? 0 : (currentPage - 1) * JOBS_PER_PAGE + 1}-
              {Math.min(currentPage * JOBS_PER_PAGE, totalResults)} of {totalResults} results
            </p>
            <div className="flex items-center gap-3">
              {selectedSortBy === 'recommended' && isRecommendationsLoading ? (
                <span className="text-sm text-white/60">Ranking for you...</span>
              ) : null}
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-[#5A5A55] px-3 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white"
                >
                  <span>{selectedSortBy === 'recommended' ? 'Recommended' : 'Newest'}</span>
                  <ListFilter size={18} />
                </button>

                {isSortMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[180px] rounded-2xl border border-white/10 bg-[#5A5A55] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                    {SORT_OPTIONS.map((option) => {
                      const isActive = selectedSortBy === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedSortBy(option.value as 'recommended' | 'postedAt')
                            setIsSortMenuOpen(false)
                          }}
                          className={`w-full rounded-xl px-4 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-white/10 text-[#E7F12E]'
                              : 'text-white/85 hover:bg-white/8 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-2xl bg-[#5A5A55] p-6 text-sm text-white/60">Loading jobs...</div>
            ) : error ? (
              <div className="rounded-2xl bg-[#5A5A55] p-6 text-sm text-red-200">{error}</div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => {
                const isSelected = selectedJobId === job.id
                const isSaved = savedJobIds.includes(job.id)

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full rounded-2xl p-4 text-left transition ${
                      isSelected
                        ? 'border border-[#E7F12E] bg-[#5A5A55]'
                        : 'border border-white/12 bg-[#5A5A55] hover:border-white/30'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            src={job.companyLogoDataUrl}
                            alt={job.companyName || 'Company logo'}
                            className="h-7 w-7"
                            textClassName="text-[10px]"
                          />
                          <p className="text-[15px] text-white/80">{job.companyName || 'Unknown company'}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[12px] text-white/35">
                            {formatRelativeDate(job.postedAt || job.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void toggleSaved(job)
                            }}
                            className="text-white/65 hover:text-white"
                            aria-label={isSaved ? 'Unsave job' : 'Save job'}
                          >
                            {isSaved ? (
                              <BookmarkCheck size={18} className="text-[#E7F12E]" />
                            ) : (
                              <Bookmark size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[17px] font-semibold text-white">{job.jobTitle || 'Untitled role'}</h3>
                      </div>

                      <div>
                        <p className="text-[13px] text-white/58">
                          {formatEmploymentLine(job.employmentType, job.jobMode)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {job.companyIndustry?.[0] ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] ${
                              profileTagMatcher.matchesIndustry(job.companyIndustry[0])
                                ? 'bg-[#DDE400] text-black'
                                : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {job.companyIndustry[0]}
                          </span>
                        ) : null}
                        {job.jobFunction?.[0] ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] ${
                              profileTagMatcher.matchesJobFunction(job.jobFunction[0])
                                ? 'bg-[#DDE400] text-black'
                                : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {job.jobFunction[0]}
                          </span>
                        ) : null}
                        {job.jobMode ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] ${
                              profileTagMatcher.matchesJobMode(job.jobMode)
                                ? 'bg-[#DDE400] text-black'
                                : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {job.jobMode}
                          </span>
                        ) : null}
                        {job.experienceLevel ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] ${
                              profileTagMatcher.matchesExperienceLevel(job.experienceLevel)
                                ? 'bg-[#DDE400] text-black'
                                : 'bg-white/15 text-white/60'
                            }`}
                          >
                            {job.experienceLevel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl bg-[#5A5A55] p-6 text-sm text-white/60">
                No jobs match your current filters.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#5A5A55] px-4 py-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm text-white/75 disabled:opacity-35"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              {pageNumbers.map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-white/55">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-8 rounded-md px-2 text-sm ${
                      currentPage === page
                        ? 'bg-[#3E3E3B] text-white'
                        : 'text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm text-white/75 disabled:opacity-35"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="self-start rounded-2xl bg-[#F0EFEA] p-5 text-[#1E1E1D]">
          {selectedJob ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CompanyLogo
                    src={selectedJob.companyLogoDataUrl}
                    alt={selectedJob.companyName || 'Company logo'}
                    className="mt-1 h-9 w-9"
                    textClassName="text-xs"
                  />
                  <div>
                    <p className="text-[16px] text-black/65">{selectedJob.companyName || 'Unknown company'}</p>
                    {isDetailLoading ? (
                      <p className="text-[13px] text-black/45">Loading full details...</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={openApplyModal}
                    disabled={!selectedJob.applicationUrl}
                    className={`min-w-[120px] rounded-md px-5 py-2.5 text-center text-[16px] font-semibold ${
                      selectedJob.applicationUrl
                        ? 'bg-[#E7F12E] text-black'
                        : 'cursor-not-allowed bg-black/10 text-black/35'
                    }`}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleSaved(selectedJob)}
                    className={`min-w-[120px] rounded-md px-5 py-2.5 text-[16px] font-semibold ${
                      savedJobIds.includes(selectedJob.id)
                        ? 'border-[3px] border-black/10 bg-black/20 text-black/40'
                        : 'border-[3px] border-black/20 text-black/35'
                    }`}
                  >
                    {savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <h2 className="text-[28px] font-semibold">{selectedJob.jobTitle || 'Untitled role'}</h2>

              <div className="mt-3 grid max-w-[360px] gap-y-2 text-[15px] text-black/75">
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Salary</span>
                  <span>{formatSalary(selectedJob.minSalary, selectedJob.maxSalary)}</span>
                </div>
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Experience level</span>
                  <span>{selectedJob.experienceLevel || 'Not specified'}</span>
                </div>
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Job model</span>
                  <span>{selectedJob.jobMode || 'Not specified'}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedJob.companyIndustry?.map((industry) => (
                  <span
                    key={industry}
                    className={`rounded px-3 py-1 text-[13px] ${
                      profileTagMatcher.matchesIndustry(industry)
                        ? 'bg-[#DDE400] text-black'
                        : 'bg-black/10 text-black/55'
                    }`}
                  >
                    {industry}
                  </span>
                ))}
                {selectedJob.jobFunction?.map((jobFunction) => (
                  <span
                    key={jobFunction}
                    className={`rounded px-3 py-1 text-[13px] ${
                      profileTagMatcher.matchesJobFunction(jobFunction)
                        ? 'bg-[#DDE400] text-black'
                        : 'bg-black/10 text-black/55'
                    }`}
                  >
                    {jobFunction}
                  </span>
                ))}
                {selectedJob.employmentType ? (
                  <span
                    className={`rounded px-3 py-1 text-[13px] ${
                      profileTagMatcher.matchesEmploymentType(selectedJob.employmentType)
                        ? 'bg-[#DDE400] text-black'
                        : 'bg-black/10 text-black/55'
                    }`}
                  >
                    {selectedJob.employmentType}
                  </span>
                ) : null}
              </div>

              <div className="my-4 h-px bg-black/10" />

              <div className="space-y-5 text-[15px] leading-7 text-black/80">
                <div>
                  <h4 className="mb-1.5 font-medium">About {selectedJob.companyName || 'the company'}</h4>
                  <JobDescription description={selectedJob.jobDescription} />
                </div>

                {selectedJob.skillTags?.length ? (
                  <div>
                    <h4 className="mb-1.5 font-medium">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skillTags.map((skill) => (
                        <span
                          key={skill}
                          className={`rounded px-3 py-1 text-[13px] ${
                            profileTagMatcher.matchesSkill(skill)
                              ? 'bg-[#DDE400] text-black'
                              : 'bg-black/10 text-black/65'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedJob.originalSourceSite ? (
                  <div>
                    <h4 className="mb-1.5 font-medium">Source</h4>
                    <p>{selectedJob.originalSourceSite}</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-black/60">Select a job to view details.</div>
          )}
        </div>
      </div>

      {isApplyModalOpen && selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
            className="w-full max-w-[520px] rounded-3xl bg-[#F0EFEA] p-6 text-[#1E1E1D] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="apply-modal-title" className="text-[24px] font-semibold">
                  How would you like to prepare?
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-black/70">
                  Choose what to do for {selectedJob.jobTitle || 'this role'} at{' '}
                  {selectedJob.companyName || 'this company'}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeApplyModal}
                className="rounded-full border border-black/10 px-3 py-1 text-[14px] text-black/65 transition hover:bg-black/5 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handlePrepareResume}
                className="rounded-2xl bg-[#E7F12E] px-5 py-4 text-left transition hover:opacity-95"
              >
                <div className="text-[18px] font-semibold">Prepare Resume</div>
                <div className="mt-1 text-[14px] text-black/70">
                  Open your documents so you can tailor a resume for this job.
                </div>
              </button>

              <button
                type="button"
                onClick={handlePrepareCoverLetter}
                className="rounded-2xl bg-white px-5 py-4 text-left transition hover:bg-black/5"
              >
                <div className="text-[18px] font-semibold">Prepare Cover Letter</div>
                <div className="mt-1 text-[14px] text-black/70">
                  Jump to your documents and start drafting a targeted cover letter.
                </div>
              </button>

              <button
                type="button"
                onClick={handleCopyApplicationLink}
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-left transition hover:bg-black/5"
              >
                <div className="text-[18px] font-semibold">Copy Application Link</div>
                <div className="mt-1 text-[14px] text-black/70">
                  Copy the job application URL to your clipboard.
                </div>
              </button>
            </div>

            {copyStatus ? (
              <p className="mt-4 text-[14px] text-black/65">{copyStatus}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    label: string
    value: string
  }>
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[170px] shrink-0 rounded-full bg-[#F0EFEA] px-5 py-3 text-[15px] font-medium text-black outline-none"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

type FilterInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function FilterInput({ label, value, onChange }: FilterInputProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder={label}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[170px] shrink-0 rounded-full bg-[#F0EFEA] px-5 py-3 text-[15px] font-medium text-black outline-none placeholder:text-black/55"
    />
  )
}

function buildPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages] as const
  }

  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages] as const
  }

  return [1, '...', currentPage, '...', totalPages] as const
}

function mapDatePostedToHours(value: string) {
  if (value === 'Last 24 hours') return 24
  if (value === 'Last 7 days') return 24 * 7
  if (value === 'Last 30 days') return 24 * 30
  return undefined
}

function sortJobsByRecommendation(jobs: JobSummary[], recommendationScores: RecommendationScoreMap) {
  return [...jobs].sort((left, right) => {
    const leftScore = recommendationScores[left.id] ?? Number.NEGATIVE_INFINITY
    const rightScore = recommendationScores[right.id] ?? Number.NEGATIVE_INFINITY

    if (leftScore !== rightScore) {
      return rightScore - leftScore
    }

    const leftPostedAt = left.postedAt ? new Date(left.postedAt).getTime() : 0
    const rightPostedAt = right.postedAt ? new Date(right.postedAt).getTime() : 0
    return rightPostedAt - leftPostedAt
  })
}

function formatRelativeDate(value?: string) {
  if (!value) return 'Unknown'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diffHours = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60)))

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatEmploymentLine(employmentType?: string, jobMode?: string) {
  return [employmentType, jobMode].filter(Boolean).join(' / ') || 'Not specified'
}

function formatSalary(minSalary?: number, maxSalary?: number) {
  if (typeof minSalary === 'number' && typeof maxSalary === 'number') {
    return `${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}`
  }

  if (typeof minSalary === 'number') {
    return `${minSalary.toLocaleString()}+`
  }

  if (typeof maxSalary === 'number') {
    return `Up to ${maxSalary.toLocaleString()}`
  }

  return 'Not specified'
}

function JobDescription({ description }: { description?: string }) {
  if (!description) {
    return <p>No description available for this job yet.</p>
  }

  const sanitizedHtml = sanitizeJobHtml(description)

  return (
    <div
      className="space-y-3 [&_a]:text-black [&_a]:underline [&_a]:underline-offset-2 [&_br]:block [&_br]:content-[''] [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

function sanitizeJobHtml(html: string) {
  if (typeof window === 'undefined') {
    return html
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button']

  blockedTags.forEach((tag) => {
    document.querySelectorAll(tag).forEach((node) => node.remove())
  })

  document.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name)
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name)
      }

      if (name === 'style') {
        element.removeAttribute(attribute.name)
      }
    })
  })

  return document.body.innerHTML
}

type CompanyLogoProps = {
  src?: string
  alt: string
  className: string
  textClassName: string
}

function CompanyLogo({ src, alt, className, textClassName }: CompanyLogoProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} rounded bg-white object-contain p-1`}
      />
    )
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded bg-[#73736E] font-semibold text-white/75`}
      aria-hidden="true"
    >
      <span className={textClassName}>LOGO</span>
    </div>
  )
}

function buildProfileTagMatcher(profile: UserProfile | null) {
  const preferences = profile?.preferences
  const skillSet = buildNormalizedSet((profile?.skills ?? []).map((skill) => skill.skill || ''))
  const industrySet = buildNormalizedSet(preferences?.industries ?? [])
  const jobFunctionSet = buildNormalizedSet(preferences?.jobFunction ?? [])
  const employmentTypeSet = buildNormalizedSet(preferences?.employmentType ?? [])
  const experienceLevelSet = buildNormalizedSet(preferences?.experienceLevel ?? [])
  const jobModeSet = buildNormalizedSet(preferences?.jobMode ?? [])

  return {
    matchesSkill: (value?: string) => skillSet.has(normalizeProfileTag(value)),
    matchesIndustry: (value?: string) => industrySet.has(normalizeProfileTag(value)),
    matchesJobFunction: (value?: string) => jobFunctionSet.has(normalizeProfileTag(value)),
    matchesEmploymentType: (value?: string) => employmentTypeSet.has(normalizeProfileTag(value)),
    matchesExperienceLevel: (value?: string) => experienceLevelSet.has(normalizeProfileTag(value)),
    matchesJobMode: (value?: string) => jobModeSet.has(normalizeProfileTag(value)),
  }
}

function buildNormalizedSet(values: string[]) {
  return new Set(values.map((value) => normalizeProfileTag(value)).filter(Boolean))
}

function normalizeProfileTag(value?: string) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  ThumbsUp,
  ThumbsDown,
  BadgeDollarSign,
  TrendingUp,
  Eye,
} from 'lucide-react'
import { authFetch } from '../../lib/authApi'
import { getCurrentUserEmail, getCurrentUserId } from '../../lib/profileApi'
import { listResumeDocuments } from '../../lib/resumeApi'
import { readSavedJobs, subscribeToSavedJobs, toggleSavedJob } from '../../lib/savedJobs'

type MatchJob = {
  id: string
  title: string
  company: string
  companyLogoDataUrl?: string | null
  applicationUrl?: string
  salary: string
  level: string
  mode: string
  type: string
  tags: string[]
  description: string
  explanation: string[]
}

type RecommendedJobApiResponse = {
  job: {
    id: string
    jobTitle: string
    companyName: string
    companyLogoDataUrl?: string | null
    companyIndustry?: string[]
    experienceLevel?: string
    jobFunction?: string[]
    employmentType?: string
    jobMode?: string
    jobDescription?: string
    minSalary?: number | null
    maxSalary?: number | null
    applicationUrl?: string
    skillTags?: string[]
  }
  scores: {
    jobId: string
    relevanceScore: number
    semanticScore?: number | null
    combinedScore: number
  }
}

const MAX_DOCUMENTS_PER_TYPE = 3

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

const fallbackMatches: MatchJob[] = [
  {
    id: '1',
    title: 'Product Designer',
    company: 'Notion',
    salary: 'HK$28k - HK$36k',
    level: 'Mid',
    mode: 'Hybrid',
    type: 'Full time',
    tags: ['SaaS', 'Design', 'Figma', 'Design Systems'],
    description:
      'WPP is the creative transformation company. We use the power of creativity to build better futures for our people, planet, clients and communities. WPP Media is WPP’s global media collective. In a world where media is everywhere and in everything, we bring the best platform, people, and partners together to create limitless opportunities for growth.',
    explanation: [
      'Strong match with UI/UX and interaction design experience',
      'Design systems and cross-functional collaboration align well',
      'Hybrid work preference is compatible with your profile',
    ],
  },
  {
    id: '2',
    title: 'Frontend Engineer',
    company: 'Stripe',
    salary: 'HK$35k - HK$48k',
    level: 'Mid-Senior',
    mode: 'Remote',
    type: 'Full time',
    tags: ['Fintech', 'Engineering', 'React', 'TypeScript'],
    description:
      'You will design intuitive interfaces across web and mobile products, work with engineers and product managers, and contribute to design system consistency.',
    explanation: [
      'React and TypeScript experience map directly to the role',
      'Remote setup matches your preferred work mode',
      'Frontend architecture and product delivery are highlighted strengths',
    ],
  },
  {
    id: '3',
    title: 'Associate Product Manager',
    company: 'Airbnb',
    salary: 'HK$26k - HK$34k',
    level: 'Junior-Mid',
    mode: 'On-site',
    type: 'Full time',
    tags: ['Marketplace', 'Product', 'Analytics', 'Roadmapping'],
    description:
      'Support product research, feature planning, backlog refinement, and stakeholder communication in a fast-moving cross-functional team.',
    explanation: [
      'Product planning and stakeholder coordination fit your background',
      'Early-career scope matches your experience level',
      'Analytics and roadmap exposure are relevant to your profile',
    ],
  },
  {
    id: '4',
    title: 'Brand & Visual Designer',
    company: 'Canva',
    salary: 'HK$24k - HK$32k',
    level: 'Mid',
    mode: 'Remote',
    type: 'Contract',
    tags: ['Creative', 'Brand', 'Illustration', 'Campaigns'],
    description:
      'Create campaign visuals, landing assets, and social creative that translate brand strategy into high-performing design. You will collaborate with marketers, copywriters, and product storytellers to keep visual language cohesive across channels.',
    explanation: [
      'Visual storytelling and campaign design align with your portfolio',
      'Remote contract format offers flexible short-term work',
      'Creative direction and execution both match your strengths',
    ],
  },
  {
    id: '5',
    title: 'UX Research Coordinator',
    company: 'Shopify',
    salary: 'HK$22k - HK$29k',
    level: 'Junior',
    mode: 'Hybrid',
    type: 'Full time',
    tags: ['Research', 'UX', 'Operations', 'Insight Synthesis'],
    description:
      'Coordinate participant recruitment, research logistics, interview notes, and insight synthesis for multiple product teams. This role is ideal for someone who enjoys structure, empathy-driven work, and turning qualitative signals into actionable findings.',
    explanation: [
      'Research support and communication-heavy work fit your profile',
      'Strong potential entry point into UX and product work',
      'Hybrid collaboration pattern aligns with your work preferences',
    ],
  },
  {
    id: '6',
    title: 'Growth Marketing Designer',
    company: 'Duolingo',
    salary: 'HK$25k - HK$33k',
    level: 'Mid',
    mode: 'Remote',
    type: 'Full time',
    tags: ['Growth', 'Marketing', 'Creative Testing', 'Motion'],
    description:
      'Design performance creatives, paid social assets, and experiment-ready concepts for acquisition campaigns. You will work closely with growth marketers to test messaging, visual directions, and lightweight motion to improve conversion.',
    explanation: [
      'Marketing design and experimentation are a strong overlap',
      'Fast iteration and creative testing suit your workflow',
      'Remote full-time format is aligned with your current preference',
    ],
  },
]

const swipeConfidenceThreshold = 12000
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity
const APPLICATION_PREP_STORAGE_KEY = 'jobs:applicationPrep'
const MATCH_BATCH_SIZE = 10

function mapRecommendationToMatchJob(item: RecommendedJobApiResponse): MatchJob {
  const job = item.job
  const score = item.scores
  return {
    id: job.id,
    title: job.jobTitle,
    company: job.companyName,
    companyLogoDataUrl: job.companyLogoDataUrl || null,
    applicationUrl: job.applicationUrl || '',
    salary: formatSalary(job.minSalary, job.maxSalary),
    level: job.experienceLevel || 'Not specified',
    mode: job.jobMode || 'Not specified',
    type: job.employmentType || 'Not specified',
    tags: [
      ...(job.companyIndustry || []).slice(0, 1),
      ...(job.jobFunction || []).slice(0, 1),
      ...(job.skillTags || []).slice(0, 2),
    ].filter(Boolean),
    description: sanitizeJobDescription(job.jobDescription),
    explanation: buildExplanation(job, score),
  }
}

function formatSalary(minSalary?: number | null, maxSalary?: number | null) {
  if (minSalary && maxSalary) {
    return `HK$${minSalary}k - HK$${maxSalary}k`
  }
  if (minSalary) {
    return `From HK$${minSalary}k`
  }
  if (maxSalary) {
    return `Up to HK$${maxSalary}k`
  }
  return 'Not specified'
}

function buildExplanation(
  job: RecommendedJobApiResponse['job'],
  score: RecommendedJobApiResponse['scores'],
) {
  const explanation: string[] = []

  if (job.jobFunction?.length) {
    explanation.push(`Role alignment is strong with ${job.jobFunction[0]}.`)
  }

  if (job.companyIndustry?.length) {
    explanation.push(`This opportunity fits your interest in ${job.companyIndustry[0]}.`)
  }

  if (job.skillTags?.length) {
    explanation.push(`Your profile overlaps with skills like ${job.skillTags.slice(0, 2).join(' and ')}.`)
  }

  if (job.jobMode) {
    explanation.push(`${job.jobMode} work mode is compatible with your saved preferences.`)
  }

  if (job.employmentType) {
    explanation.push(`${job.employmentType} setup matches the type of roles you are targeting.`)
  }

  if (typeof score.semanticScore === 'number' && score.semanticScore >= 0.35) {
    explanation.push('Your background and this job description show a strong overall fit.')
  }

  if (explanation.length === 0) {
    explanation.push('This job aligns well with the skills and preferences saved in your profile.')
  }

  return explanation.slice(0, 4)
}

function sanitizeJobDescription(value?: string) {
  if (!value) {
    return 'No job description available.'
  }

  const withoutTags = value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  return decoded
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export default function MatchesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState<MatchJob[]>(fallbackMatches)
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [isLoadingNextBatch, setIsLoadingNextBatch] = useState(false)
  const [matchBatchPage, setMatchBatchPage] = useState(0)
  const [hasMoreMatches, setHasMoreMatches] = useState(true)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [feedback, setFeedback] = useState<Record<string, 'yes' | 'no'>>({})
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

  const totalSlides = matches.length + 1
  const isEnd = index >= matches.length
  const currentJob = useMemo(() => matches[index], [matches, index])

  const loadMatchBatch = async (page: number, useFallbackOnEmpty = false) => {
    const email = getCurrentUserEmail()
    const userId = getCurrentUserId()
    const query = new URLSearchParams()

    if (email) {
      query.set('email', email)
    } else if (userId) {
      query.set('userId', userId)
    }

    query.set('page', String(page))
    query.set('size', String(MATCH_BATCH_SIZE))

    const response = await authFetch(`/api/jobs/recommendations?${query.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to load recommendations: ${response.status}`)
    }

    const data = (await response.json()) as RecommendedJobApiResponse[]
    const nextMatches = data.map(mapRecommendationToMatchJob)

    if (nextMatches.length === 0 && useFallbackOnEmpty) {
      return fallbackMatches
    }

    return nextMatches
  }

  useEffect(() => {
    const loadInitialMatches = async () => {
      try {
        const nextMatches = await loadMatchBatch(0, true)
        setMatches(nextMatches)
        setMatchBatchPage(0)
        setHasMoreMatches(nextMatches.length >= MATCH_BATCH_SIZE)
        setIndex(0)
      } catch (error) {
        console.error(error)
        setMatches(fallbackMatches)
        setMatchBatchPage(0)
        setHasMoreMatches(false)
      } finally {
        setIsLoadingMatches(false)
      }
    }

    void loadInitialMatches()
  }, [])

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
    const query = new URLSearchParams(location.search)
    const requestedJobId = query.get('savedJobId')

    if (!requestedJobId) {
      return
    }

    const nextIndex = matches.findIndex((job) => String(job.id) === requestedJobId)
    if (nextIndex >= 0) {
      setIndex(nextIndex)
    }
  }, [location.search])

  const paginate = (newDirection: number) => {
    if (newDirection > 0) {
      setDirection(1)
      setIndex((prev) => Math.min(prev + 1, matches.length))
    } else {
      setDirection(-1)
      setIndex((prev) => Math.max(prev - 1, 0))
    }
  }

  const handleFeedback = (value: 'yes' | 'no') => {
    if (!currentJob) return
    setFeedback((prev) => ({
      ...prev,
      [currentJob.id]: value,
    }))
  }

  const openApplyModal = () => {
    setCopyStatus(null)
    setIsApplyModalOpen(true)
  }

  const closeApplyModal = () => {
    setCopyStatus(null)
    setIsApplyModalOpen(false)
  }

  const toggleSaved = async () => {
    if (!currentJob) return

    const nextItems = await toggleSavedJob({
      id: String(currentJob.id),
      title: currentJob.title,
      companyName: currentJob.company,
      employmentType: currentJob.type,
      jobMode: currentJob.mode,
      experienceLevel: currentJob.level,
      description: currentJob.description,
      tags: currentJob.tags,
      savedAt: new Date().toISOString(),
      source: 'matches',
    })
    setSavedJobIds(nextItems.map((item) => item.id))
  }

  const storeApplicationPrepContext = (mode: 'resume' | 'cover-letter') => {
    if (!currentJob) return

    window.localStorage.setItem(
      APPLICATION_PREP_STORAGE_KEY,
      JSON.stringify({
        mode,
        jobId: String(currentJob.id),
        applicationUrl: currentJob.applicationUrl || '',
        jobTitle: currentJob.title,
        companyName: currentJob.company,
        employmentType: currentJob.type,
        jobMode: currentJob.mode,
        experienceLevel: currentJob.level,
        jobDescription: currentJob.description,
        skillTags: currentJob.tags,
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
    setCopyStatus('No application link is available for this match.')
  }

  const handleLoadNextBatch = async () => {
    setIsLoadingNextBatch(true)

    try {
      const nextPage = matchBatchPage + 1
      const nextMatches = await loadMatchBatch(nextPage)

      if (nextMatches.length > 0) {
        setMatches(nextMatches)
        setMatchBatchPage(nextPage)
        setHasMoreMatches(nextMatches.length >= MATCH_BATCH_SIZE)
        setIndex(0)
        setDirection(0)
      } else {
        setHasMoreMatches(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingNextBatch(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') paginate(1)
      if (e.key === 'ArrowLeft') paginate(-1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isSaved = currentJob ? savedJobIds.includes(String(currentJob.id)) : false

  if (isLoadingMatches) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1100px] flex-col items-center justify-center px-6 py-10 text-white/75">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-[#E7F12E]" />
        <p className="mt-4 text-[15px] text-white/70">Loading matches...</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-120px)] max-w-[1100px] flex-col items-center">
      <div className="mb-4 flex gap-3">
        {Array.from({ length: totalSlides }).map((_, dotIndex) => (
          <motion.div
            key={dotIndex}
            animate={{
              scale: dotIndex === index ? 1.15 : 1,
              opacity: dotIndex === index ? 1 : 0.7,
            }}
            className={`h-3 w-3 rounded-full border border-white ${
              dotIndex === index ? 'bg-white' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => paginate(-1)}
          disabled={index === 0}
          className="absolute left-0 z-20 hidden h-14 w-14 items-center justify-center rounded-full text-white/90 transition hover:scale-110 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 md:flex"
        >
          <ChevronLeft size={44} strokeWidth={2.2} />
        </button>

        <div className="w-full max-w-[832px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {isEnd ? (
              <motion.div
                key="end-screen"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="rounded-2xl bg-[#666662] px-8 py-16 text-center"
              >
                <div className="mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-full bg-[#E7F12E]/10 text-7xl">
                  🔎
                </div>

                <h2 className="text-5xl font-semibold tracking-tight">
                  {hasMoreMatches
                    ? "You've seen all matches in this batch!"
                    : "You've reached the end of your matches!"}
                </h2>
                <p className="mt-3 text-2xl text-white/70">
                  {hasMoreMatches
                    ? 'Do you want to continue to'
                    : 'You can explore more opportunities in the jobs page.'}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-5">
                  <button
                    type="button"
                    onClick={() => void handleLoadNextBatch()}
                    disabled={isLoadingNextBatch || !hasMoreMatches}
                    className="rounded-lg bg-[#E7F12E] px-7 py-3 text-lg font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingNextBatch
                      ? 'Loading...'
                      : hasMoreMatches
                        ? 'View more matches'
                        : 'No more matches'}
                  </button>

                  <Link
                    to="/jobs"
                    className="rounded-lg border-2 border-white/25 px-7 py-3 text-lg font-semibold text-white/60 transition hover:border-white/40 hover:text-white"
                  >
                    Browse all jobs
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentJob.id}
                custom={direction}
                initial={{
                  x: direction > 0 ? 180 : -180,
                  opacity: 0,
                  rotate: direction > 0 ? 3 : -3,
                  scale: 0.97,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                exit={{
                  x: direction > 0 ? -180 : 180,
                  opacity: 0,
                  rotate: direction > 0 ? -3 : 3,
                  scale: 0.97,
                }}
                transition={{ type: 'spring', stiffness: 230, damping: 24 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.95}
                onDragEnd={(_, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x)
                  if (swipe < -swipeConfidenceThreshold) paginate(1)
                  else if (swipe > swipeConfidenceThreshold) paginate(-1)
                }}
                className="space-y-5"
              >
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[#666662] p-4"
                >
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-[18px] font-semibold">
                      Why this job is matched?
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <span>Is this match relevant to you?</span>

                      <button
                        type="button"
                        onClick={() => handleFeedback('yes')}
                        className={`flex items-center gap-1 rounded-md border px-3 py-1 transition ${
                          feedback[currentJob.id] === 'yes'
                            ? 'border-[#67d36f] bg-[#67d36f]/20 text-white'
                            : 'border-white/20 text-white/80 hover:border-white/35'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        Yes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFeedback('no')}
                        className={`flex items-center gap-1 rounded-md border px-3 py-1 transition ${
                          feedback[currentJob.id] === 'no'
                            ? 'border-[#f25b5b] bg-[#f25b5b]/20 text-white'
                            : 'border-white/20 text-white/80 hover:border-white/35'
                        }`}
                      >
                        <ThumbsDown size={14} />
                        No
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md bg-[#8B8A84]/65 p-4">
                    <div className="space-y-3">
                      {currentJob.explanation.map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.08 }}
                          className="flex items-center gap-3 text-[17px]"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E7F12E] text-black">
                            <Check size={14} strokeWidth={3} />
                          </span>
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[#F0EFEA] p-4 text-[#1E1E1D]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-[#7B7A74]">
                        {currentJob.companyLogoDataUrl ? (
                          <img
                            src={currentJob.companyLogoDataUrl}
                            alt={currentJob.company}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-[16px] text-black/65">
                          {currentJob.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={openApplyModal}
                        className="min-w-[120px] rounded-md bg-[#E7F12E] px-5 py-2.5 text-[16px] font-semibold text-black transition hover:opacity-95"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleSaved()}
                        className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[16px] font-semibold transition ${
                          isSaved
                            ? 'border-[3px] border-black/10 bg-black/20 text-black/45'
                            : 'border-[3px] border-black/20 text-black/35 hover:border-black/35 hover:text-black/55'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck size={18} className="text-[#E7F12E]" /> : <Bookmark size={18} />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-[28px] font-semibold">{currentJob.title}</h2>

                  <div className="mt-3 grid max-w-[360px] gap-y-2 text-[15px] text-black/75">
                    <div className="grid grid-cols-[170px_1fr] items-center">
                      <span className="flex items-center gap-2">
                        <BadgeDollarSign size={16} />
                        Salary
                      </span>
                      <span>{currentJob.salary}</span>
                    </div>
                    <div className="grid grid-cols-[170px_1fr] items-center">
                      <span className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        Experience level
                      </span>
                      <span>{currentJob.level}</span>
                    </div>
                    <div className="grid grid-cols-[170px_1fr] items-center">
                      <span className="flex items-center gap-2">
                        <Eye size={16} />
                        Job model
                      </span>
                      <span>{currentJob.mode}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentJob.tags.map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className={`rounded px-3 py-1 text-[13px] ${
                          i === 0
                            ? 'bg-[#DDE400] text-black'
                            : 'bg-black/10 text-black/55'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="my-4 h-px bg-black/10" />

                  <div className="space-y-5 text-[15px] leading-7 text-black/80">
                    <div>
                      <h4 className="mb-1.5 font-medium">
                        About {currentJob.company}
                      </h4>
                      <p>{currentJob.description}</p>
                    </div>

                    <div>
                      <h4 className="mb-1.5 font-medium">
                        Role Summary and Impact
                      </h4>
                      <p>
                        This opportunity is one of your highest-ranked recommendations based on your saved profile,
                        preferences, and semantic fit with the job description.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-1.5 font-medium">
                        Core Responsibilities
                      </h4>
                      <p>
                        Review the original posting for detailed responsibilities and application requirements.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => paginate(1)}
          disabled={isEnd}
          className="absolute right-0 z-20 hidden h-14 w-14 items-center justify-center rounded-full text-white/90 transition hover:scale-110 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 md:flex"
        >
          <ChevronRight size={44} strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-6 flex gap-4 md:hidden">
        <button
          type="button"
          onClick={() => paginate(-1)}
          disabled={index === 0}
          className="rounded-lg border border-white/20 px-4 py-2 text-white/85 disabled:opacity-30"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => paginate(1)}
          disabled={isEnd}
          className="rounded-lg bg-[#E7F12E] px-4 py-2 font-semibold text-black disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {isApplyModalOpen && currentJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[520px] rounded-3xl bg-[#F0EFEA] p-6 text-[#1E1E1D] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-semibold">How would you like to prepare?</h3>
                <p className="mt-2 text-[15px] leading-6 text-black/70">
                  Choose what to do for {currentJob.title} at {currentJob.company}.
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
                  Open your documents and tailor a resume for this match.
                </div>
              </button>

              <button
                type="button"
                onClick={handlePrepareCoverLetter}
                className="rounded-2xl bg-white px-5 py-4 text-left transition hover:bg-black/5"
              >
                <div className="text-[18px] font-semibold">Prepare Cover Letter</div>
                <div className="mt-1 text-[14px] text-black/70">
                  Start a targeted cover letter draft for this match.
                </div>
              </button>

              <button
                type="button"
                onClick={handleCopyApplicationLink}
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-left transition hover:bg-black/5"
              >
                <div className="text-[18px] font-semibold">Copy Application Link</div>
                <div className="mt-1 text-[14px] text-black/70">
                  Copy the application link when one is available.
                </div>
              </button>
            </div>

            {copyStatus ? <p className="mt-4 text-[14px] text-black/65">{copyStatus}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ThumbsUp,
  ThumbsDown,
  BriefcaseBusiness,
  BadgeDollarSign,
  TrendingUp,
  Eye,
} from 'lucide-react'

type MatchJob = {
  id: number
  title: string
  company: string
  salary: string
  level: string
  mode: string
  type: string
  tags: string[]
  description: string
  explanation: string[]
}

const matches: MatchJob[] = [
  {
    id: 1,
    title: 'Job title',
    company: 'Company name',
    salary: '16k',
    level: 'Junior',
    mode: 'On-site',
    type: 'Full time',
    tags: ['Industry', 'Function', 'Keywords', 'Keywords'],
    description:
      'WPP is the creative transformation company. We use the power of creativity to build better futures for our people, planet, clients and communities. WPP Media is WPP’s global media collective. In a world where media is everywhere and in everything, we bring the best platform, people, and partners together to create limitless opportunities for growth.',
    explanation: ['Job type as Full time', 'Job function as Designer'],
  },
  {
    id: 2,
    title: 'UI Designer',
    company: 'Meta',
    salary: '20k',
    level: 'Mid',
    mode: 'Remote',
    type: 'Full time',
    tags: ['Design', 'Function', 'Figma', 'Keywords'],
    description:
      'You will design intuitive interfaces across web and mobile products, work with engineers and product managers, and contribute to design system consistency.',
    explanation: ['Strong UI/UX skill match', 'Remote preference matched'],
  },
  {
    id: 3,
    title: 'Product Associate',
    company: 'Airbnb',
    salary: '18k',
    level: 'Junior',
    mode: 'Hybrid',
    type: 'Full time',
    tags: ['Product', 'Function', 'Strategy', 'Keywords'],
    description:
      'Support product research, feature planning, backlog refinement, and stakeholder communication in a fast-moving cross-functional team.',
    explanation: ['Experience level as Junior', 'Hybrid work mode matched'],
  },
]

const swipeConfidenceThreshold = 12000
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity

export default function MatchesPage() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [feedback, setFeedback] = useState<Record<number, 'yes' | 'no'>>({})

  const totalSlides = matches.length + 1
  const isEnd = index >= matches.length
  const currentJob = useMemo(() => matches[index], [index])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') paginate(1)
      if (e.key === 'ArrowLeft') paginate(-1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
                  You&apos;ve seen all matches in this batch!
                </h2>
                <p className="mt-3 text-2xl text-white/70">
                  Do you want to continue to
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-5">
                  <button className="rounded-lg bg-[#E7F12E] px-7 py-3 text-lg font-semibold text-black transition hover:opacity-95">
                    View more matches
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
                      <div className="h-10 w-10 rounded bg-[#7B7A74]" />
                      <div>
                        <p className="text-[16px] text-black/65">
                          {currentJob.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="min-w-[120px] rounded-md bg-[#E7F12E] px-5 py-2.5 text-[16px] font-semibold text-black transition hover:opacity-95">
                        Apply
                      </button>
                      <button className="min-w-[120px] rounded-md border-[3px] border-black/20 px-5 py-2.5 text-[16px] font-semibold text-black/35 transition hover:border-black/35 hover:text-black/55">
                        Save
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
                        This role will contribute to planning, execution, and
                        coordination across projects. You will work with internal
                        and external stakeholders to ensure effective delivery and
                        business impact.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-1.5 font-medium">
                        Core Responsibilities
                      </h4>
                      <p>
                        Develop plans and recommendations, coordinate project
                        execution, manage daily communication, and support
                        high-quality delivery aligned with business goals.
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
    </div>
  )
}
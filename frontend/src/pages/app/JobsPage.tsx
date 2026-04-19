import { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react'

type Job = {
  id: number
  title: string
  company: string
  location: string
  employmentType: string
  jobMode: string
  experienceLevel: string
  industry: string
  jobFunction: string
  datePosted: string
  description: string
  isSaved: boolean
}

const jobsData: Job[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'Google',
    location: 'Hong Kong',
    employmentType: 'Full-time',
    jobMode: 'Remote',
    experienceLevel: 'Junior',
    industry: 'Technology',
    jobFunction: 'Engineering',
    datePosted: '1d ago',
    description:
      'Build and maintain modern frontend interfaces using React and TypeScript. Collaborate with designers and product teams to deliver polished user experiences.',
    isSaved: false,
  },
  {
    id: 2,
    title: 'UI/UX Designer',
    company: 'Spotify',
    location: 'Singapore',
    employmentType: 'Contract',
    jobMode: 'Hybrid',
    experienceLevel: 'Mid',
    industry: 'Media',
    jobFunction: 'Design',
    datePosted: '1d ago',
    description:
      'Design intuitive digital experiences and collaborate with product teams. Work across user flows, interaction patterns, and interface systems.',
    isSaved: true,
  },
  {
    id: 3,
    title: 'Business Analyst',
    company: 'Deloitte',
    location: 'Hong Kong',
    employmentType: 'Full-time',
    jobMode: 'On-site',
    experienceLevel: 'Junior',
    industry: 'Consulting',
    jobFunction: 'Business',
    datePosted: '1d ago',
    description:
      'Support project analysis, requirements gathering, and stakeholder communication. Translate business needs into structured recommendations.',
    isSaved: false,
  },
  {
    id: 4,
    title: 'Product Associate',
    company: 'Airbnb',
    location: 'Remote',
    employmentType: 'Internship',
    jobMode: 'Remote',
    experienceLevel: 'Junior',
    industry: 'Technology',
    jobFunction: 'Product',
    datePosted: '2d ago',
    description:
      'Assist product managers in research, backlog grooming, and user story definition while working with cross-functional teams.',
    isSaved: false,
  },
  {
    id: 5,
    title: 'Marketing Executive',
    company: 'Canva',
    location: 'Singapore',
    employmentType: 'Full-time',
    jobMode: 'Hybrid',
    experienceLevel: 'Mid',
    industry: 'Media',
    jobFunction: 'Marketing',
    datePosted: '3d ago',
    description:
      'Drive campaign execution, content coordination, and performance reporting across digital and brand channels.',
    isSaved: true,
  },
  {
    id: 6,
    title: 'Software Engineer',
    company: 'Microsoft',
    location: 'Hong Kong',
    employmentType: 'Full-time',
    jobMode: 'On-site',
    experienceLevel: 'Senior',
    industry: 'Technology',
    jobFunction: 'Engineering',
    datePosted: '5d ago',
    description:
      'Develop scalable platform features, contribute to architecture decisions, and collaborate closely with engineering peers.',
    isSaved: false,
  },
]

const JOBS_PER_PAGE = 4

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(jobsData)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('')
  const [selectedJobMode, setSelectedJobMode] = useState('')
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedJobFunction, setSelectedJobFunction] = useState('')
  const [selectedDatePosted, setSelectedDatePosted] = useState('')

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesEmploymentType =
        selectedEmploymentType === '' || job.employmentType === selectedEmploymentType

      const matchesJobMode =
        selectedJobMode === '' || job.jobMode === selectedJobMode

      const matchesExperienceLevel =
        selectedExperienceLevel === '' || job.experienceLevel === selectedExperienceLevel

      const matchesIndustry =
        selectedIndustry === '' || job.industry === selectedIndustry

      const matchesCompany =
        selectedCompany === '' || job.company === selectedCompany

      const matchesJobFunction =
        selectedJobFunction === '' || job.jobFunction === selectedJobFunction

      const matchesDatePosted =
        selectedDatePosted === '' || normalizeDatePosted(job.datePosted) === selectedDatePosted

      return (
        matchesSearch &&
        matchesEmploymentType &&
        matchesJobMode &&
        matchesExperienceLevel &&
        matchesIndustry &&
        matchesCompany &&
        matchesJobFunction &&
        matchesDatePosted
      )
    })
  }, [
    jobs,
    searchTerm,
    selectedEmploymentType,
    selectedJobMode,
    selectedExperienceLevel,
    selectedIndustry,
    selectedCompany,
    selectedJobFunction,
    selectedDatePosted,
  ])

  const [currentPage, setCurrentPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE))
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + JOBS_PER_PAGE)

  const [selectedJobId, setSelectedJobId] = useState<number>(jobsData[0].id)

  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    paginatedJobs[0] ??
    filteredJobs[0] ??
    null

  useEffect(() => {
    if (selectedJob && selectedJob.id !== selectedJobId) {
      setSelectedJobId(selectedJob.id)
    }
  }, [selectedJob, selectedJobId])

  const toggleSaved = (jobId: number) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isSaved: !job.isSaved } : job,
      ),
    )
  }

  const resetFilters = () => {
    setSelectedEmploymentType('')
    setSelectedJobMode('')
    setSelectedExperienceLevel('')
    setSelectedIndustry('')
    setSelectedCompany('')
    setSelectedJobFunction('')
    setSelectedDatePosted('')
  }

  const pageNumbers = buildPageNumbers(currentPage, totalPages)

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
              options={['Last 24 hours', 'Last 7 days', 'Last 30 days']}
            />
            <FilterSelect
              label="Employment type"
              value={selectedEmploymentType}
              onChange={setSelectedEmploymentType}
              options={['Full-time', 'Part-time', 'Internship', 'Contract']}
            />
            <FilterSelect
              label="Experience level"
              value={selectedExperienceLevel}
              onChange={setSelectedExperienceLevel}
              options={['Junior', 'Mid', 'Senior']}
            />
            <FilterSelect
              label="Job function"
              value={selectedJobFunction}
              onChange={setSelectedJobFunction}
              options={['Engineering', 'Design', 'Business', 'Product', 'Marketing']}
            />
            <FilterSelect
              label="Industry"
              value={selectedIndustry}
              onChange={setSelectedIndustry}
              options={['Technology', 'Media', 'Consulting']}
            />
            <FilterSelect
              label="Company"
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={['Google', 'Spotify', 'Deloitte', 'Airbnb', 'Canva', 'Microsoft']}
            />
            <FilterSelect
              label="Job mode"
              value={selectedJobMode}
              onChange={setSelectedJobMode}
              options={['Remote', 'Hybrid', 'On-site']}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_2.05fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[16px] text-white/85">
              Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} results
            </p>
            <button className="text-white/70" type="button" aria-label="Filter summary">
              <ListFilter size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {paginatedJobs.length > 0 ? (
              paginatedJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id

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
                          <div className="h-7 w-7 bg-[#73736E]" />
                          <p className="text-[15px] text-white/80">{job.company}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[12px] text-white/35">{job.datePosted}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSaved(job.id)
                            }}
                            className="text-white/65 hover:text-white"
                            aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
                          >
                            {job.isSaved ? (
                              <BookmarkCheck size={18} className="text-[#E7F12E]" />
                            ) : (
                              <Bookmark size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[17px] font-semibold text-white">{job.title}</h3>
                      </div>

                      <div>
                        <p className="text-[13px] text-white/58">
                          {job.employmentType} · {job.jobMode}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded bg-[#DDE400] px-2 py-0.5 text-[11px] text-black">
                          {job.industry}
                        </span>
                        <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] text-white/60">
                          {job.jobFunction}
                        </span>
                        <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] text-white/60">
                          {job.location}
                        </span>
                        <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] text-white/60">
                          {job.experienceLevel}
                        </span>
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

        <div className="rounded-2xl bg-[#F0EFEA] p-5 text-[#1E1E1D]">
          {selectedJob ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 bg-[#73736E]" />
                  <div>
                    <p className="text-[16px] text-black/65">{selectedJob.company}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="min-w-[120px] rounded-md bg-[#E7F12E] px-5 py-2.5 text-[16px] font-semibold text-black">
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSaved(selectedJob.id)}
                    className={`min-w-[120px] rounded-md px-5 py-2.5 text-[16px] font-semibold ${
                      selectedJob.isSaved
                        ? 'border-[3px] border-black/10 bg-black/20 text-black/40'
                        : 'border-[3px] border-black/20 text-black/35'
                    }`}
                  >
                    {selectedJob.isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <h2 className="text-[28px] font-semibold">{selectedJob.title}</h2>

              <div className="mt-3 grid max-w-[360px] gap-y-2 text-[15px] text-black/75">
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Salary</span>
                  <span>16k</span>
                </div>
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Experience level</span>
                  <span>{selectedJob.experienceLevel}</span>
                </div>
                <div className="grid grid-cols-[170px_1fr]">
                  <span>Job model</span>
                  <span>{selectedJob.jobMode}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded bg-[#DDE400] px-3 py-1 text-[13px] text-black">
                  {selectedJob.industry}
                </span>
                <span className="rounded bg-black/10 px-3 py-1 text-[13px] text-black/55">
                  {selectedJob.jobFunction}
                </span>
                <span className="rounded bg-black/10 px-3 py-1 text-[13px] text-black/55">
                  {selectedJob.location}
                </span>
                <span className="rounded bg-black/10 px-3 py-1 text-[13px] text-black/55">
                  {selectedJob.employmentType}
                </span>
              </div>

              <div className="my-4 h-px bg-black/10" />

              <div className="space-y-5 text-[15px] leading-7 text-black/80">
                <div>
                  <h4 className="mb-1.5 font-medium">About {selectedJob.company}</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div>
                  <h4 className="mb-1.5 font-medium">Role Summary and Impact</h4>
                  <p>
                    This role will contribute to planning, execution, and coordination
                    across projects. You will work with internal and external stakeholders
                    to ensure effective delivery and business impact.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1.5 font-medium">Core Responsibilities</h4>
                  <p>
                    Develop plans and recommendations, coordinate project execution,
                    manage daily communication, and support high-quality delivery aligned
                    with business goals.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-black/60">Select a job to view details.</div>
          )}
        </div>
      </div>
    </div>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
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
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function normalizeDatePosted(datePosted: string) {
  if (datePosted.includes('1d')) return 'Last 24 hours'
  if (datePosted.includes('2d') || datePosted.includes('3d') || datePosted.includes('5d')) {
    return 'Last 7 days'
  }
  return 'Last 30 days'
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
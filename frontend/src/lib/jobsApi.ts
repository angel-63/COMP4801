import type { JobSummary, JobsResponse } from '../types/job'
import { authFetch } from './authApi'

type SearchJobsParams = {
  keyword?: string
  employmentType?: string
  jobMode?: string
  experienceLevel?: string
  industry?: string
  company?: string
  jobFunction?: string
  hours?: number
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export async function searchJobs(params: SearchJobsParams) {
  const query = new URLSearchParams()

  appendParam(query, 'keyword', params.keyword)
  appendParam(query, 'employmentType', params.employmentType)
  appendParam(query, 'jobMode', params.jobMode)
  appendParam(query, 'experienceLevel', params.experienceLevel)
  appendParam(query, 'industry', params.industry)
  appendParam(query, 'company', params.company)
  appendParam(query, 'jobFunction', params.jobFunction)

  if (params.hours) {
    query.set('hours', String(params.hours))
  }

  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))
  query.set('sortBy', params.sortBy ?? 'postedAt')
  query.set('direction', params.direction ?? 'desc')

  const response = await authFetch(`/api/jobs?${query.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to load jobs: ${response.status}`)
  }

  const payload = await response.json()
  return normalizeJobsResponse(payload)
}

export async function fetchJobById(id: string) {
  const response = await authFetch(`/api/jobs/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to load job details: ${response.status}`)
  }

  return (await response.json()) as JobSummary
}

function appendParam(query: URLSearchParams, key: string, value?: string) {
  if (value && value.trim()) {
    query.append(key, value)
  }
}

function normalizeJobsResponse(payload: unknown): JobsResponse {
  const raw = payload as {
    content?: JobSummary[]
    page?: {
      totalPages?: number
      totalElements?: number
      size?: number
      number?: number
    }
    totalPages?: number
    totalElements?: number
    size?: number
    number?: number
  }

  return {
    content: Array.isArray(raw.content) ? raw.content : [],
    totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
    totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
    size: raw.page?.size ?? raw.size ?? 0,
    number: raw.page?.number ?? raw.number ?? 0,
  }
}

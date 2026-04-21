import { getCurrentUserId } from './profileApi'
import type { SavedJob } from '../types/savedJob'

const SAVED_JOBS_UPDATED_EVENT = 'saved-jobs-updated'

function getStorageKey() {
  return `savedJobs:${getCurrentUserId()}`
}

function readSavedJobsFromLocalStorage() {
  if (typeof window === 'undefined') return [] as SavedJob[]

  const rawValue = window.localStorage.getItem(getStorageKey())
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? (parsed as SavedJob[]) : []
  } catch {
    return []
  }
}

function writeSavedJobsToLocalStorage(items: SavedJob[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getStorageKey(), JSON.stringify(items))
}

function notifySavedJobsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SAVED_JOBS_UPDATED_EVENT))
}

export function subscribeToSavedJobs(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = () => listener()
  const handleCustomEvent = () => listener()

  window.addEventListener('storage', handleStorage)
  window.addEventListener(SAVED_JOBS_UPDATED_EVENT, handleCustomEvent)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(SAVED_JOBS_UPDATED_EVENT, handleCustomEvent)
  }
}

async function fetchSavedJobsFromBackend() {
  const response = await fetch(`/api/users/${getCurrentUserId()}/saved-jobs`)

  if (!response.ok) {
    throw new Error(`Failed to load saved jobs: ${response.status}`)
  }

  const payload = (await response.json()) as SavedJob[]
  const items = Array.isArray(payload) ? payload : []
  writeSavedJobsToLocalStorage(items)
  return items
}

async function replaceSavedJobsInBackend(items: SavedJob[]) {
  const response = await fetch(`/api/users/${getCurrentUserId()}/saved-jobs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  })

  if (!response.ok) {
    throw new Error(`Failed to save saved jobs: ${response.status}`)
  }

  const payload = (await response.json()) as SavedJob[]
  const nextItems = Array.isArray(payload) ? payload : []
  writeSavedJobsToLocalStorage(nextItems)
  notifySavedJobsUpdated()
  return nextItems
}

export async function readSavedJobs() {
  const localItems = readSavedJobsFromLocalStorage()

  try {
    const backendItems = await fetchSavedJobsFromBackend()

    if (backendItems.length === 0 && localItems.length > 0) {
      return await replaceSavedJobsInBackend(localItems)
    }

    return backendItems
  } catch {
    return localItems
  }
}

export async function isJobSaved(jobId: string) {
  return (await readSavedJobs()).some((job) => job.id === jobId)
}

export async function toggleSavedJob(job: SavedJob) {
  const existing = await readSavedJobs()
  const alreadySaved = existing.some((item) => item.id === job.id)

  if (alreadySaved) {
    return removeSavedJob(job.id)
  }

  const payload = {
    ...job,
    savedAt: job.savedAt || new Date().toISOString(),
  }

  try {
    const response = await fetch(`/api/users/${getCurrentUserId()}/saved-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to save job: ${response.status}`)
    }

    const nextItems = (await response.json()) as SavedJob[]
    writeSavedJobsToLocalStorage(nextItems)
    notifySavedJobsUpdated()
    return nextItems
  } catch {
    const nextItems = [{ ...payload }, ...existing.filter((item) => item.id !== payload.id)]
    writeSavedJobsToLocalStorage(nextItems)
    notifySavedJobsUpdated()
    return nextItems
  }
}

export async function removeSavedJob(jobId: string) {
  const existing = await readSavedJobs()

  try {
    const response = await fetch(`/api/users/${getCurrentUserId()}/saved-jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to remove saved job: ${response.status}`)
    }

    const nextItems = (await response.json()) as SavedJob[]
    writeSavedJobsToLocalStorage(nextItems)
    notifySavedJobsUpdated()
    return nextItems
  } catch {
    const nextItems = existing.filter((item) => item.id !== jobId)
    writeSavedJobsToLocalStorage(nextItems)
    notifySavedJobsUpdated()
    return nextItems
  }
}

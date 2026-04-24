import type { UserProfile } from '../types/profile'

const AUTH_TOKEN_STORAGE_KEY = 'authToken'
const CURRENT_USER_STORAGE_KEY = 'currentUserId'
const CURRENT_USER_EMAIL_STORAGE_KEY = 'currentUserEmail'
const PENDING_REGISTRATION_STORAGE_KEY = 'pendingRegistration'

type AuthResponse = {
  token: string
  userId: string
  email: string
}

type LoginCredentials = {
  email: string
  password: string
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
}

export function hasAuthToken() {
  return Boolean(getAuthToken())
}

export function hasPendingRegistration() {
  return Boolean(window.localStorage.getItem(PENDING_REGISTRATION_STORAGE_KEY))
}

export function setAuthSession(session: AuthResponse) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token)
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, session.userId)
  window.localStorage.setItem(CURRENT_USER_EMAIL_STORAGE_KEY, session.email)
  window.localStorage.setItem('isLoggedIn', 'true')
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  window.localStorage.removeItem(CURRENT_USER_EMAIL_STORAGE_KEY)
  window.localStorage.removeItem('isLoggedIn')
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAuthToken()
  const headers = new Headers(init.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    clearAuthSession()
  }

  return response
}

export async function loginUser(credentials: LoginCredentials) {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Invalid email or password.'))
  }

  const session = (await response.json()) as AuthResponse
  setAuthSession(session)
  return session
}

export async function registerUser(profile: UserProfile, password: string) {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRegistrationPayload(profile, password)),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, `Registration failed: ${response.status}`))
  }

  const session = (await response.json()) as AuthResponse
  setAuthSession(session)
  return session
}

async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get('Content-Type') || ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { message?: string; error?: string }
    return payload.message || payload.error || fallback
  }

  return fallback
}

function buildRegistrationPayload(profile: UserProfile, password: string) {
  return {
    email: profile.email || '',
    password,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
    location: profile.location || '',
    links: profile.links || [],
    preferences: {
      jobFunctions: profile.preferences?.jobFunctions || [],
      industries: profile.preferences?.industries || [],
      employmentTypes: (profile.preferences?.employmentTypes || []).map(toEmploymentType),
      experienceLevels: (profile.preferences?.experienceLevels || []).map(toExperienceLevel),
      jobModes: (profile.preferences?.jobModes || []).map(toJobMode),
      minSalary: profile.preferences?.minSalary || 0,
      roleCategories: profile.preferences?.roleCategories || [],
    },
    educations: (profile.education || []).map((item) => ({
      ...item,
      startDate: toInstant(item.startDate),
      endDate: toInstant(item.endDate),
    })),
    experiences: (profile.workExperience || []).map((item) => ({
      ...item,
      startDate: toInstant(item.startDate),
      endDate: toInstant(item.endDate),
    })),
    projects: (profile.projects || []).map((item) => ({
      id: item.id,
      projectName: item.name,
      projectOwner: item.owner,
      startDate: toInstant(item.startDate),
      endDate: toInstant(item.endDate),
      location: item.location,
      description: item.description,
      technologies: item.technologies,
    })),
    skills: (profile.skills || []).map((skill) => skill.name).filter(Boolean),
  }
}

function toInstant(value?: string) {
  if (!value) return null

  const monthYear = value.match(/^(\d{2})\/(\d{4})$/)
  if (monthYear) {
    const [, month, year] = monthYear
    return `${year}-${month}-01T00:00:00.000Z`
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toEmploymentType(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('full')) return 'FULL_TIME'
  if (normalized.includes('part')) return 'PART_TIME'
  if (normalized.includes('contract')) return 'CONTRACT'
  if (normalized.includes('intern')) return 'INTERNSHIP'
  return 'OTHER'
}

function toExperienceLevel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('intern')) return 'INTERNSHIP'
  if (normalized.includes('entry')) return 'ENTRY'
  if (normalized.includes('associate')) return 'ASSOCIATE'
  if (normalized.includes('mid')) return 'MID_SENIOR'
  if (normalized.includes('director')) return 'DIRECTOR'
  return 'OTHER'
}

function toJobMode(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('remote')) return 'REMOTE'
  if (normalized.includes('hybrid')) return 'HYBRID'
  return 'ONSITE'
}

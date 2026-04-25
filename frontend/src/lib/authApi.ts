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
  console.log(JSON.stringify(buildRegistrationPayload(profile, password)));
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
      jobFunction: profile.preferences?.jobFunction || [],
      industries: profile.preferences?.industries || [],
      employmentType: (profile.preferences?.employmentType || []).map(toEmploymentType),
      experienceLevel: (profile.preferences?.experienceLevel || []).map(toExperienceLevel),
      jobMode: (profile.preferences?.jobMode || []).map(toJobMode),
      minSalary: profile.preferences?.minSalary || 0,
      roleCategory: profile.preferences?.roleCategory || [],
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
      projectName: item.projectName,
      projectOwner: item.projectOwner,
      startDate: toInstant(item.startDate),
      endDate: toInstant(item.endDate),
      location: item.location,
      description: item.description,
      technologies: item.technologies,
    })),
    skills: (profile.skills || []).map((skill) => skill.skill).filter(Boolean),
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
  if (normalized.includes('full')) return 'fulltime'
  if (normalized.includes('part')) return 'parttime'
  if (normalized.includes('contract')) return 'contract'
  if (normalized.includes('intern')) return 'internship'
  return 'other'
}

function toExperienceLevel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('intern')) return 'internship'
  if (normalized.includes('entry')) return 'entry level'
  if (normalized.includes('associate')) return 'associate'
  if (normalized.includes('mid')) return 'mid-senior level'
  if (normalized.includes('director')) return 'director'
  return 'other'
}

function toJobMode(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('remote')) return 'remote'
  if (normalized.includes('hybrid')) return 'hybrid'
  return 'onsite'
}

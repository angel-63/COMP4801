import type { UserProfile } from '../types/profile'
import { authFetch } from './authApi'

export const DEFAULT_USER_ID = 'demo-user'
const CURRENT_USER_STORAGE_KEY = 'currentUserId'
const CURRENT_USER_EMAIL_STORAGE_KEY = 'currentUserEmail'
const USER_PROFILE_STORAGE_KEY = 'userProfile'

export function getCurrentUserId() {
  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) || DEFAULT_USER_ID
}

export function setCurrentUserId(userId: string) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId)
}

export function getCurrentUserEmail() {
  return window.localStorage.getItem(CURRENT_USER_EMAIL_STORAGE_KEY) || ''
}

export function setCurrentUserEmail(email: string) {
  window.localStorage.setItem(CURRENT_USER_EMAIL_STORAGE_KEY, email)
}

export async function fetchUserProfile(userId: string) {
  const response = await authFetch(`/api/users/${userId}`)

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}`)
  }

  const profile = (await response.json()) as UserProfile
  cacheUserProfile(profile)
  return profile
}

export async function fetchUserProfileByEmail(email: string) {
  const response = await authFetch(`/api/users?email=${encodeURIComponent(email)}`)

  if (!response.ok) {
    throw new Error(`Failed to load profile: ${response.status}`)
  }

  const profile = (await response.json()) as UserProfile
  cacheUserProfile(profile)
  return profile
}

export async function fetchCurrentUserProfile() {
  const cachedProfile = getCachedUserProfile()
  const email = getCurrentUserEmail() || cachedProfile?.email || ''

  if (email) {
    return fetchUserProfileByEmail(email)
  }

  return fetchUserProfile(getCurrentUserId())
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  const response = await authFetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  })

  if (!response.ok) {
    throw new Error(`Failed to save profile: ${response.status}`)
  }

  const savedProfile = (await response.json()) as UserProfile
  cacheUserProfile(savedProfile)
  return savedProfile
}

export function getCachedUserProfile() {
  const rawValue = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as UserProfile
  } catch {
    return null
  }
}

function cacheUserProfile(profile: UserProfile) {
  const fullName =
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()

  const snapshot = {
    ...profile,
    fullName,
    name: fullName,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    links: (profile.links || []).map((link) => ({
      id: link.id,
      label: link.site || '',
      site: link.site || '',
      url: link.url || '',
    })),
  }

  window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(snapshot))
  window.localStorage.setItem('profile', JSON.stringify(snapshot))

  if (profile.email) {
    window.localStorage.setItem(CURRENT_USER_EMAIL_STORAGE_KEY, profile.email)
  }
}

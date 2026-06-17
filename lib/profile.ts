const KEY = 'chismografo_profile'

export interface Profile {
  username: string
  avatarSeed: string
}

export function getProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearProfile(): void {
  localStorage.removeItem(KEY)
}


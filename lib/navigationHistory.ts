export const NAV_PREV_PATH_KEY = 'hoppenings_prev_path'
export const NAV_CURRENT_PATH_KEY = 'hoppenings_current_path'

export function getPreviousPath(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(NAV_PREV_PATH_KEY)
}

export function getCurrentPath(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(NAV_CURRENT_PATH_KEY)
}

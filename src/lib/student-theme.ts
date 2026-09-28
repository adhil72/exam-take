import { useSyncExternalStore } from 'react'

// Student exam screens are light by default; the student can switch to dark from the exam header.
// Stored separately from the admin's appearance setting so the two never affect each other.
const KEY = 'student_theme'
export type StudentTheme = 'light' | 'dark'

const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getStudentTheme(): StudentTheme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: StudentTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.body.classList.toggle('dark', theme === 'dark')
}

export function useStudentTheme() {
  const theme = useSyncExternalStore(subscribe, getStudentTheme)
  const toggle = () => {
    try {
      localStorage.setItem(KEY, theme === 'dark' ? 'light' : 'dark')
    } catch {
      /* storage unavailable: the switch just won't persist */
    }
    listeners.forEach((l) => l())
  }
  return { theme, toggle }
}

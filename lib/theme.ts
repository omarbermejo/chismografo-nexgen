'use client'

import { useEffect, useState, useCallback } from 'react'

const KEY = 'chismografo_theme'
export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? 'dark'
}

export function setTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem(KEY, t) } catch {}
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

// Lee el tema real del DOM tras montar (evita hydration mismatch).
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')
  useEffect(() => { setThemeState(getTheme()) }, [])
  const toggle = useCallback(() => setThemeState(toggleTheme()), [])
  return { theme, toggle }
}

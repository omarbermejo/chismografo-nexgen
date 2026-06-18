import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hash determinista (no Math.random → estable en SSR/cliente, sin hydration mismatch).
export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Inclinación sutil determinista en grados, a partir de un id/seed.
export function tiltFromSeed(seed: string, max = 2): number {
  const steps = max * 2 + 1
  return ((hashStr(seed) % steps) - max) * 0.5
}

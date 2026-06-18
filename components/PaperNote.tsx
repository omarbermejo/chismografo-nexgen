'use client'

import type { CSSProperties, ReactNode } from 'react'
import { cn, tiltFromSeed } from '@/lib/utils'

interface Props {
  /** id/seed para derivar la inclinación de forma determinista (sin hydration mismatch). */
  seed: string
  /** Muestra el trozo de washi tape arriba. */
  tape?: boolean
  /** Inclinación máxima en pasos de 0.5° (default 2 → ±1°). */
  tilt?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
  onClick?: () => void
}

export default function PaperNote({ seed, tape = false, tilt = 2, className, style, children, onClick }: Props) {
  const deg = tiltFromSeed(seed, tilt)
  return (
    <div
      onClick={onClick}
      className={cn('note', tape && 'note--tape', className)}
      style={{ '--tilt': `${deg}deg`, ...style } as CSSProperties}
    >
      {children}
    </div>
  )
}

'use client'

import avatar from 'animal-avatar-generator'
import type { CSSProperties } from 'react'

interface AvatarProps {
  seed: string
  size?: number
  className?: string
  style?: CSSProperties
}

export default function Avatar({ seed, size = 64, className = '', style }: AvatarProps) {
  const svg = avatar(seed, { size, round: false })
  return (
    <div
      className={className}
      style={{ width: size, height: size, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

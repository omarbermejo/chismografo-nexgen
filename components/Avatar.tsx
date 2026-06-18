'use client'

import avatar from 'animal-avatar-generator'
import type { CSSProperties } from 'react'
import { cn, tiltFromSeed } from '@/lib/utils'

type Frame = 'none' | 'polaroid' | 'tape' | 'stamp'

interface AvatarProps {
  seed: string
  size?: number
  className?: string
  style?: CSSProperties
  frame?: Frame
}

export default function Avatar({ seed, size = 64, className = '', style, frame = 'none' }: AvatarProps) {
  const svg = avatar(seed, { size, round: false })
  const img = (
    <div
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )

  if (frame === 'none') {
    return (
      <div
        className={className}
        style={{ width: size, height: size, ...style }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  const deg = tiltFromSeed(seed, 4)
  const frameClass = frame === 'polaroid' ? 'frame-polaroid' : frame === 'tape' ? 'frame-tape' : 'frame-stamp'

  return (
    <div
      className={cn(frameClass, 'overflow-hidden', className)}
      style={{ '--frame-tilt': `${deg}deg`, ...style } as CSSProperties}
    >
      {img}
    </div>
  )
}

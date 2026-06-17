'use client'

import avatar from 'animal-avatar-generator'

interface AvatarProps {
  seed: string
  size?: number
  className?: string
}

export default function Avatar({ seed, size = 64, className = '' }: AvatarProps) {
  const svg = avatar(seed, { size, round: true })
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

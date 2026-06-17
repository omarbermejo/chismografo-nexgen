'use client'

const avatar = require('nextjs-animal-avatar-generator').default

interface AvatarProps {
  seed: string
  size?: number
  className?: string
}

export default function Avatar({ seed, size = 64, className = '' }: AvatarProps) {
  const svg = avatar(seed, { size })
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { startTransition, type CSSProperties } from 'react'

interface Props {
  text: string
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

// Tokeniza el texto separando #hashtags del resto
function tokenize(text: string): { type: 'text' | 'tag'; value: string }[] {
  const parts = text.split(/(#[\wÀ-ɏ]+)/g)
  return parts.map(p => ({
    type: p.startsWith('#') ? 'tag' : 'text',
    value: p,
  }))
}

export default function HashtagText({ text, className, style, onClick }: Props) {
  const router = useRouter()

  const tokens = tokenize(text)

  return (
    <p className={className} style={style} onClick={onClick}>
      {tokens.map((token, i) =>
        token.type === 'tag' ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              startTransition(() => router.push(`/hashtag/${token.value.slice(1)}`))
            }}
            className="font-bold hover:underline underline-offset-2 transition-colors"
            style={{ color: 'var(--highlight)' }}
          >
            {token.value}
          </button>
        ) : (
          <span key={i}>{token.value}</span>
        )
      )}
    </p>
  )
}

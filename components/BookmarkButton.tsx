'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkSolid } from 'iconoir-react'
import { addBookmark, removeBookmark, isBookmarked } from '@/lib/bookmarks'
import type { Chisme } from '@/lib/api'

interface Props {
  chisme: Chisme
  size?: number
}

export default function BookmarkButton({ chisme, size = 15 }: Props) {
  const [saved, setSaved] = useState(() => isBookmarked(chisme.id))

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (saved) {
      removeBookmark(chisme.id)
    } else {
      addBookmark(chisme.id)
    }
    setSaved(v => !v)
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.85 }}
      className="flex items-center"
      title={saved ? 'quitar de guardados' : 'guardar'}
    >
      <motion.div animate={saved ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
        {saved
          ? <BookmarkSolid width={size} height={size} style={{ color: 'var(--highlight)' }} />
          : <Bookmark width={size} height={size} color="var(--ink-soft)" />
        }
      </motion.div>
    </motion.button>
  )
}

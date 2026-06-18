'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Props {
  text: string
  /** Clases tipográficas del texto real (manuscrita). */
  className?: string
}

/**
 * Secreto tachado — el signature. El texto va tapado con marcador; al tocar,
 * el marcador se borra con un barrido L→R y revela lo escrito.
 */
export default function SecretText({ text, className = '' }: Props) {
  const [revealed, setRevealed] = useState(false)
  const words = text.split(/(\s+)/) // conserva los espacios

  function reveal() {
    if (revealed) return
    setRevealed(true)
    toast('shhh… no digas que te lo conté.')
  }

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={reveal}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal() } }}
    >
      {/* Texto real (debajo) */}
      <motion.p
        className={className}
        initial={false}
        animate={revealed ? { filter: 'blur(0px)', opacity: 1 } : { filter: 'blur(3px)', opacity: 0 }}
        transition={{ duration: 0.4, delay: revealed ? 0.15 : 0 }}
      >
        {text}
      </motion.p>

      {/* Capa de marcador (encima) que se borra al revelar */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            className={`absolute inset-0 pointer-events-none ${className}`}
            initial={{ clipPath: 'inset(0 0 0 0)' }}
            exit={{ clipPath: 'inset(0 0 0 100%)' }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            aria-hidden
          >
            {words.map((w, i) =>
              w.trim() === ''
                ? <span key={i}>{w}</span>
                : <span key={i} className="redacted">{w}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {!revealed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-1 block text-[11px] font-mono uppercase tracking-widest text-ink-faint"
          >
            toca para ver 👆
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

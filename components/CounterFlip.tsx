'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  count: number
  active?: boolean
  large?: boolean
}

export default function CounterFlip({ count, active, large }: Props) {
  return (
    <div className={`overflow-hidden flex items-center min-w-[10px] ${large ? 'h-[26px]' : 'h-[18px]'}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: large ? -16 : -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: large ? 16 : 12, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className={`tabular-nums font-mono block leading-none ${large ? 'text-[20px] font-bold' : 'text-[13px]'}`}
          style={{ color: active ? 'var(--highlight)' : 'var(--ink-faint)' }}
        >
          {count > 0 ? count : '0'}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

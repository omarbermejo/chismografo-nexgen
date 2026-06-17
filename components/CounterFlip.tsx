'use client'

import { AnimatePresence, motion } from 'framer-motion'

const BRAND = '#39e079'

interface Props {
  count: number
  active?: boolean
}

export default function CounterFlip({ count, active }: Props) {
  return (
    <div className="overflow-hidden h-[18px] flex items-center min-w-[12px]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="text-[13px] tabular-nums font-medium block leading-none"
          style={{ color: active ? BRAND : '#606060' }}
        >
          {count > 0 ? count : ''}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

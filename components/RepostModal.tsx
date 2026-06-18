'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Xmark, Refresh } from 'iconoir-react'
import TextareaAutosize from 'react-textarea-autosize'
import { type Chisme } from '@/lib/api'
import { type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

interface Props {
  chisme: Chisme | null
  profile: Profile
  isReposted: boolean
  onClose: () => void
  onConfirm: (id: string, texto?: string) => Promise<void>
}

export default function RepostModal({ chisme, profile, isReposted, onClose, onConfirm }: Props) {
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!chisme || sending || isReposted) return
    setSending(true)
    try {
      await onConfirm(chisme.id, texto.trim() || undefined)
      onClose()
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {chisme && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />

          {/* Centering wrapper — offset for sidebar (220px) */}
          <div
            key="centering"
            className="fixed z-50 flex items-center justify-center px-4"
            style={{ top: 0, bottom: 0, left: 220, right: 0, pointerEvents: 'none' }}
          >
          {/* Centered modal */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="note flex flex-col bg-paper-raised border border-border w-full"
            style={{ maxWidth: 480, maxHeight: '82vh', pointerEvents: 'all' }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 border-b border-line" style={{ height: 52 }}>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 hover:bg-[var(--state-hover)] transition-colors"
              >
                <Xmark width={17} height={17} color="var(--ink-soft)" />
              </motion.button>
              <div className="flex items-center gap-2">
                <Refresh width={13} height={13} style={{ color: 'var(--highlight)' }} />
                <span className="text-[12px] font-black uppercase tracking-widest text-ink">
                  pásalo
                </span>
              </div>
              <div className="w-8" />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Compose */}
              <div className="px-4 pt-4 pb-3 flex gap-3">
                <div className="flex flex-col items-center gap-0">
                  <Avatar seed={profile.avatarSeed} size={36} frame="tape" className="shrink-0" />
                  {/* Thread connector */}
                  <div className="w-px flex-1 mt-2 min-h-[20px]" style={{ background: 'var(--border)' }} />
                </div>
                <div className="flex-1 min-w-0 pb-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-ink mb-2">
                    {profile.username}
                  </p>
                  <TextareaAutosize
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder="dale tu toque… (opcional)"
                    maxLength={500}
                    minRows={2}
                    autoFocus
                    className="w-full bg-transparent font-hand text-[19px] text-ink placeholder-ink-faint resize-none outline-none leading-[1.5]"
                  />
                </div>
              </div>

              {/* Original post */}
              <div className="px-4 pb-5 flex gap-3">
                <div className="shrink-0 flex flex-col items-center" style={{ width: 36 }}>
                  <Avatar seed={chisme.avatar_seed} size={28} frame="tape" className="shrink-0" />
                </div>
                <div className="flex-1 min-w-0 border border-line bg-paper px-3 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink-soft">
                      {chisme.username}
                    </span>
                  </div>
                  <p className="font-hand text-[16px] text-ink-soft leading-[1.4] line-clamp-5">
                    {chisme.texto}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-4 border-t border-line bg-paper-raised">
              <motion.button
                onClick={handleSubmit}
                disabled={sending || isReposted}
                whileTap={!isReposted ? { scale: 0.97 } : undefined}
                className="w-full py-4 text-[12px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed"
                style={{
                  background: isReposted ? 'var(--state-disabled-bg)' : sending ? 'var(--paper-sunken)' : 'var(--highlight)',
                  color: isReposted ? 'var(--state-disabled-ink)' : sending ? 'var(--ink-soft)' : 'var(--highlight-ink)',
                  border: isReposted ? '1px solid var(--border)' : 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={sending ? 'sending' : isReposted ? 'done' : 'idle'}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.12 }}
                    className="block"
                  >
                    {sending ? 'pasando…' : isReposted ? '↻ ya se lo pasaste' : 'pásalo →'}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Xmark, Refresh } from 'iconoir-react'
import TextareaAutosize from 'react-textarea-autosize'
import { type Chisme } from '@/lib/api'
import { type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'

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
            className="fixed inset-0 z-40 bg-black/75"
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
            className="flex flex-col bg-[#080808] border border-[#1c1c1c] w-full"
            style={{ maxWidth: 480, maxHeight: '82vh', pointerEvents: 'all' }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 border-b border-[#181818]" style={{ height: 52 }}>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 hover:bg-white/[0.05] transition-colors"
              >
                <Xmark width={17} height={17} color="#505050" />
              </motion.button>
              <div className="flex items-center gap-2">
                <Refresh width={13} height={13} style={{ color: BRAND }} />
                <span className="text-[12px] font-black uppercase tracking-widest text-white">
                  Repost
                </span>
              </div>
              <div className="w-8" />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Compose */}
              <div className="px-4 pt-4 pb-3 flex gap-3">
                <div className="flex flex-col items-center gap-0">
                  <Avatar
                    seed={profile.avatarSeed}
                    size={36}
                    className="overflow-hidden shrink-0"
                    style={{ borderRadius: 0 }}
                  />
                  {/* Thread connector */}
                  <div className="w-px flex-1 mt-2 min-h-[20px]" style={{ background: '#1c1c1c' }} />
                </div>
                <div className="flex-1 min-w-0 pb-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white mb-2">
                    {profile.username}
                  </p>
                  <TextareaAutosize
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder="Agrega un comentario…"
                    maxLength={500}
                    minRows={2}
                    autoFocus
                    className="w-full bg-transparent text-[15px] text-[#e0e0e0] placeholder-[#282828] resize-none outline-none leading-[1.6]"
                  />
                </div>
              </div>

              {/* Original post */}
              <div className="px-4 pb-5 flex gap-3">
                <div className="shrink-0 flex flex-col items-center" style={{ width: 36 }}>
                  <Avatar
                    seed={chisme.avatar_seed}
                    size={28}
                    className="overflow-hidden shrink-0"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="flex-1 min-w-0 border border-[#181818] px-3 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#404040]">
                      {chisme.username}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#555] leading-[1.6] line-clamp-5">
                    {chisme.texto}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-4 border-t border-[#181818] bg-[#080808]">
              <motion.button
                onClick={handleSubmit}
                disabled={sending || isReposted}
                whileTap={!isReposted ? { scale: 0.97 } : undefined}
                className="w-full py-4 text-[12px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed"
                style={{
                  background: isReposted ? '#0a0a0a' : sending ? '#1a1a1a' : BRAND,
                  color: isReposted ? '#282828' : sending ? '#404040' : '#000',
                  border: isReposted ? '1px solid #181818' : 'none',
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
                    {sending ? 'Reposteando…' : isReposted ? '↻ Ya reposteado' : 'Repostear →'}
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

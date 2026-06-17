'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import { getChismes, postChisme, reaccionar, EMOJIS, type Chisme, type Emoji } from '@/lib/api'
import Avatar from '@/components/Avatar'
import { slideDown, staggerContainer, staggerItem } from '@/lib/variants'

const HEADER_H = 56

function getReacted(): Record<string, Emoji> {
  try { return JSON.parse(localStorage.getItem('chismografo_reacted') ?? '{}') } catch { return {} }
}
function saveReacted(map: Record<string, Emoji>) {
  localStorage.setItem('chismografo_reacted', JSON.stringify(map))
}

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reacted, setReacted] = useState<Record<string, Emoji>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setReacted(getReacted())
    loadChismes()
  }, [router])

  async function loadChismes() {
    try {
      const data = await getChismes()
      setChismes(data)
    } finally {
      setLoading(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending || !profile) return
    setSending(true)
    try {
      const nuevo = await postChisme(texto.trim(), profile.username, profile.avatarSeed)
      setChismes(prev => [nuevo, ...prev])
      setTexto('')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  async function handleReaccion(chismeId: string, emoji: Emoji) {
    if (reacted[chismeId]) return
    const newReacted = { ...reacted, [chismeId]: emoji }
    setReacted(newReacted)
    saveReacted(newReacted)
    setChismes(prev => prev.map(c =>
      c.id === chismeId
        ? { ...c, reacciones: { ...c.reacciones, [emoji]: c.reacciones[emoji] + 1 } }
        : c
    ))
    await reaccionar(chismeId, emoji)
  }

  function handleLogout() {
    clearProfile()
    router.replace('/setup')
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#f0f0f0]">

      {/* ── Header fixed ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ height: HEADER_H }}
        className="fixed inset-x-0 top-0 z-20 bg-[#0e0e0e]/80 backdrop-blur-md border-b border-white/[0.05]"
      >
        <div className="h-full max-w-xl mx-auto px-5 flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight text-white">Chismógrafo</span>
          <motion.button
            onClick={handleLogout}
            whileHover={{ opacity: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5"
          >
            <ViewTransition name="user-avatar">
              <Avatar seed={profile.avatarSeed} size={30} className="rounded-full overflow-hidden" />
            </ViewTransition>
            <span className="text-[13px] text-[#666] font-medium">{profile.username}</span>
          </motion.button>
        </div>
      </motion.header>

      <div style={{ height: HEADER_H }} />

      <div className="max-w-xl mx-auto">

        {/* ── Compose ── */}
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          onSubmit={handlePost}
          className="px-5 py-5 flex gap-4 border-b border-white/[0.05]"
        >
          <ViewTransition name="user-avatar-compose">
            <Avatar seed={profile.avatarSeed} size={38} className="rounded-full overflow-hidden shrink-0" />
          </ViewTransition>

          <div className="flex flex-col flex-1 gap-3 min-w-0">
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (texto.trim() && !sending) handlePost(e as unknown as React.FormEvent)
                }
              }}
              placeholder="¿Qué está pasando? (Enter para publicar)"
              rows={2}
              maxLength={500}
              className="w-full bg-transparent text-[15px] text-[#f0f0f0] placeholder-[#333] resize-none outline-none leading-relaxed font-normal"
            />
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {texto.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] text-[#383838]"
                  >
                    {texto.length}/500
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                disabled={!texto.trim() || sending}
                whileTap={{ scale: 0.94 }}
                className="ml-auto text-[13px] font-semibold text-[#0e0e0e] bg-white disabled:opacity-20 disabled:cursor-not-allowed px-4 py-1.5 rounded-full transition-opacity"
              >
                {sending ? (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                    Enviando…
                  </motion.span>
                ) : 'Publicar'}
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* ── Feed ── */}
        {loading ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} variants={staggerItem} className="px-5 py-5 flex gap-4 border-b border-white/[0.04]">
                <motion.div
                  animate={{ opacity: [0.08, 0.18, 0.08] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.08 }}
                  className="w-[38px] h-[38px] rounded-full bg-white shrink-0"
                />
                <div className="flex flex-col gap-2.5 flex-1 pt-1">
                  <motion.div animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.08 + 0.1 }} className="h-2 bg-white rounded-full w-1/5" />
                  <motion.div animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.08 + 0.2 }} className="h-2 bg-white rounded-full w-4/5" />
                  <motion.div animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.08 + 0.3 }} className="h-2 bg-white rounded-full w-3/5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : chismes.length === 0 ? (
          <motion.div variants={slideDown} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-20">
            <p className="text-[15px] font-medium text-[#333]">Nada por aquí aún</p>
            <p className="text-[13px] text-[#2a2a2a]">Sé el primero en chismear.</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col">
            <AnimatePresence initial={false}>
              {chismes.map((c, i) => (
                <motion.article
                  key={c.id}
                  layout
                  variants={i === 0 && chismes.length > 1 ? slideDown : staggerItem}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-5 flex gap-4 border-b border-white/[0.04]"
                >
                  <Avatar seed={c.avatar_seed} size={38} className="rounded-full overflow-hidden shrink-0 mt-0.5" />

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-[#ccc]">{c.username}</span>
                      <span className="text-[#2a2a2a] text-[11px]">·</span>
                      <span className="text-[12px] text-[#2e2e2e]">{timeAgo(c.created_at)}</span>
                    </div>

                    {/* Texto */}
                    <p className="text-[14px] text-[#ddd] leading-[1.6] whitespace-pre-wrap break-words font-normal">
                      {c.texto}
                    </p>

                    {/* Reacciones */}
                    <div className="flex items-center gap-2 mt-1">
                      {EMOJIS.map(emoji => {
                        const count = c.reacciones[emoji] ?? 0
                        const isReacted = reacted[c.id] === emoji
                        const hasReacted = !!reacted[c.id]
                        return (
                          <motion.button
                            key={emoji}
                            onClick={() => handleReaccion(c.id, emoji)}
                            disabled={hasReacted}
                            whileTap={!hasReacted ? { scale: 1.3 } : undefined}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] transition-colors
                              ${isReacted
                                ? 'bg-white/10 text-white'
                                : hasReacted
                                  ? 'opacity-30 cursor-default text-[#555]'
                                  : 'text-[#555] hover:bg-white/5 hover:text-[#aaa] cursor-pointer'
                              }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && (
                              <motion.span
                                key={count}
                                initial={{ scale: 1.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="font-medium tabular-nums"
                              >
                                {count}
                              </motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}

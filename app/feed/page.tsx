'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh } from 'iconoir-react'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import { getChismes, postChisme, darLike, darRepost, type Chisme } from '@/lib/api'
import Avatar from '@/components/Avatar'
import CommentSection from '@/components/CommentSection'
import CounterFlip from '@/components/CounterFlip'
import { slideDown, staggerContainer, staggerItem } from '@/lib/variants'

const BRAND = '#39e079'
const HEADER_H = 56

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Record<string, true>>({})
  const [reposted, setReposted] = useState<Record<string, true>>({})
  const [openComments, setOpenComments] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setLiked(getLS('chismografo_liked', {}))
    setReposted(getLS('chismografo_reposted', {}))
    loadChismes()
  }, [router])

  async function loadChismes() {
    try { setChismes(await getChismes()) }
    finally { setLoading(false) }
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

  async function handleLike(id: string) {
    if (liked[id]) return
    const next = { ...liked, [id]: true as const }
    setLiked(next); setLS('chismografo_liked', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, like_count: c.like_count + 1 } : c))
    await darLike(id)
  }

  async function handleRepost(id: string) {
    if (reposted[id]) return
    const next = { ...reposted, [id]: true as const }
    setReposted(next); setLS('chismografo_reposted', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, repost_count: c.repost_count + 1 } : c))
    await darRepost(id)
  }

  function toggleComments(id: string) {
    setOpenComments(prev => prev === id ? null : id)
  }

  function handleCommentAdded(id: string) {
    setChismes(prev => prev.map(c => c.id === id ? { ...c, comment_count: c.comment_count + 1 } : c))
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
        transition={{ duration: 0.35 }}
        style={{ height: HEADER_H }}
        className="fixed inset-x-0 top-0 z-20 bg-[#0e0e0e]/85 backdrop-blur-md border-b border-white/[0.06]"
      >
        <div className="h-full max-w-[600px] mx-auto px-4 flex items-center justify-between">
          <span className="text-[16px] font-bold tracking-tight text-white">Chismógrafo</span>
          <motion.button
            onClick={handleLogout}
            whileHover={{ opacity: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <ViewTransition name="user-avatar">
              <Avatar seed={profile.avatarSeed} size={30} className="rounded-full overflow-hidden" />
            </ViewTransition>
            <span className="text-[13px] text-[#555] font-medium">{profile.username}</span>
          </motion.button>
        </div>
      </motion.header>

      <div style={{ height: HEADER_H }} />

      <div className="max-w-[600px] mx-auto">

        {/* ── Compose ── */}
        <motion.form
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onSubmit={handlePost}
          className="px-4 pt-4 pb-3 flex gap-3 border-b border-white/[0.06]"
        >
          <ViewTransition name="user-avatar-compose">
            <Avatar seed={profile.avatarSeed} size={40} className="rounded-full overflow-hidden shrink-0 mt-0.5" />
          </ViewTransition>

          <div className="flex flex-col flex-1 gap-2 min-w-0">
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
              placeholder="¿Qué está pasando?"
              rows={2}
              maxLength={500}
              className="w-full bg-transparent text-[15px] text-[#e8e8e8] placeholder-[#2e2e2e] resize-none outline-none leading-[1.55] font-normal"
            />

            <div className="flex items-center justify-between">
              <AnimatePresence>
                {texto.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[11px] text-[#333]">{texto.length}/500</span>
                    <span className="text-[11px] text-[#2a2a2a]">Shift+Enter para salto de línea</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                disabled={!texto.trim() || sending}
                whileTap={{ scale: 0.93 }}
                className="ml-auto text-[13px] font-semibold text-black bg-white disabled:opacity-20 disabled:cursor-not-allowed px-4 py-1.5 rounded-full"
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
              <motion.div key={i} variants={staggerItem} className="px-4 py-3 flex gap-3 border-b border-white/[0.04]">
                <motion.div
                  animate={{ opacity: [0.06, 0.15, 0.06] }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 }}
                  className="w-10 h-10 rounded-full bg-white shrink-0"
                />
                <div className="flex flex-col gap-2.5 flex-1 pt-1">
                  <div className="flex gap-3">
                    <motion.div animate={{ opacity: [0.06, 0.15, 0.06] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 }} className="h-2 bg-white rounded-full w-[80px]" />
                    <motion.div animate={{ opacity: [0.06, 0.15, 0.06] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 + 0.1 }} className="h-2 bg-white rounded-full w-[40px]" />
                  </div>
                  <motion.div animate={{ opacity: [0.06, 0.15, 0.06] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 + 0.15 }} className="h-2 bg-white rounded-full w-full" />
                  <motion.div animate={{ opacity: [0.06, 0.15, 0.06] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.1 + 0.2 }} className="h-2 bg-white rounded-full w-4/5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : chismes.length === 0 ? (
          <motion.div variants={slideDown} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-24">
            <p className="text-[15px] font-semibold text-[#2a2a2a]">Nada por aquí aún</p>
            <p className="text-[13px] text-[#222]">Sé el primero en chismear.</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col">
            <AnimatePresence initial={false}>
              {chismes.map((c, i) => {
                const isLiked = !!liked[c.id]
                const isReposted = !!reposted[c.id]
                const commentsOpen = openComments === c.id

                return (
                  <motion.div
                    key={c.id}
                    layout
                    variants={i === 0 && chismes.length > 1 ? slideDown : staggerItem}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-white/[0.05] overflow-hidden"
                  >
                    <article className="px-4 pt-3 pb-2 flex gap-3">

                      {/* ── Columna izquierda: avatar + thread line ── */}
                      <div className="flex flex-col items-center shrink-0">
                        <Avatar seed={c.avatar_seed} size={40} className="rounded-full overflow-hidden" />
                        <AnimatePresence>
                          {commentsOpen && (
                            <motion.div
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              exit={{ scaleY: 0, opacity: 0 }}
                              style={{ transformOrigin: 'top' }}
                              className="w-px flex-1 bg-white/[0.1] mt-2 min-h-[32px]"
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Columna derecha: contenido ── */}
                      <div className="flex flex-col flex-1 min-w-0 pb-1">

                        {/* Header: username · tiempo */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[15px] font-semibold text-white leading-none">{c.username}</span>
                          <span className="text-[#3a3a3a] text-[13px]">·</span>
                          <span className="text-[13px] text-[#3a3a3a] leading-none">{timeAgo(c.created_at)}</span>
                        </div>

                        {/* Texto */}
                        <p className="text-[15px] text-[#e8e8e8] leading-[1.55] whitespace-pre-wrap break-words mt-0.5">
                          {c.texto}
                        </p>

                        {/* ── Barra de acciones ── */}
                        <div className="flex items-center gap-1 mt-2 -ml-2">

                          {/* Like */}
                          <motion.button
                            onClick={() => handleLike(c.id)}
                            whileTap={!isLiked ? { scale: 0.85 } : undefined}
                            className="flex items-center gap-1 group"
                          >
                            <motion.div
                              className="p-2 rounded-full transition-colors duration-150 group-hover:bg-[#39e079]/10"
                              animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                              transition={{ duration: 0.25 }}
                            >
                              {isLiked
                                ? <HeartSolid width={20} height={20} style={{ color: BRAND }} />
                                : <Heart width={20} height={20} color="#606060" />
                              }
                            </motion.div>
                            <CounterFlip count={c.like_count} active={isLiked} />
                          </motion.button>

                          {/* Comentario */}
                          <motion.button
                            onClick={() => toggleComments(c.id)}
                            whileTap={{ scale: 0.85 }}
                            className="flex items-center gap-1 group"
                          >
                            <div className="p-2 rounded-full transition-colors duration-150 group-hover:bg-[#39e079]/10">
                              <MessageText
                                width={20} height={20}
                                color={commentsOpen ? BRAND : '#606060'}
                              />
                            </div>
                            <CounterFlip count={c.comment_count} active={commentsOpen} />
                          </motion.button>

                          {/* Repost */}
                          <motion.button
                            onClick={() => handleRepost(c.id)}
                            whileTap={!isReposted ? { scale: 0.85 } : undefined}
                            className="flex items-center gap-1 group"
                          >
                            <div className="p-2 rounded-full transition-colors duration-150 group-hover:bg-[#39e079]/10">
                              <motion.div
                                animate={{ rotate: isReposted ? 360 : 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                              >
                                <Refresh width={20} height={20} color={isReposted ? BRAND : '#606060'} />
                              </motion.div>
                            </div>
                            <CounterFlip count={c.repost_count} active={isReposted} />
                          </motion.button>

                        </div>
                      </div>
                    </article>

                    {/* ── Comentarios ── */}
                    <AnimatePresence>
                      {commentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <CommentSection
                            key={c.id}
                            chismeId={c.id}
                            profile={profile}
                            onCommentAdded={() => handleCommentAdded(c.id)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}

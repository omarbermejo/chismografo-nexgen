'use client'

import { useEffect, useState, useRef, startTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, FireFlame } from 'iconoir-react'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import { getChismes, postChisme, darLike, darRepost, type Chisme } from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import TextareaAutosize from 'react-textarea-autosize'
import { staggerContainer, staggerItem, slideDown } from '@/lib/variants'

const BRAND = '#39e079'
const HEADER_H = 56

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
    .replace('alrededor de ', '')
    .replace('menos de ', '')
    .replace(' minutos', 'm')
    .replace(' minuto', 'm')
    .replace(' horas', 'h')
    .replace(' hora', 'h')
    .replace(' días', 'd')
    .replace(' día', 'd')
    .replace(' meses', 'mo')
    .replace(' mes', 'mo')
}

export default function FeedPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [liked, setLiked] = useState<Record<string, true>>({})
  const [reposted, setReposted] = useState<Record<string, true>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' })

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setLiked(getLS('chismografo_liked', {}))
    setReposted(getLS('chismografo_reposted', {}))
    loadPage(1, true)
  }, [router])

  const loadPage = useCallback(async (p: number, reset = false) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await getChismes(p)
      setChismes(prev => reset ? res.data : [...prev, ...res.data])
      setHasMore(res.hasMore)
      setPage(p)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (inView && !loading && !loadingMore && hasMore) {
      loadPage(page + 1)
    }
  }, [inView, loading, loadingMore, hasMore, page, loadPage])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending || !profile) return
    setSending(true)
    try {
      const nuevo = await postChisme(texto.trim(), profile.username, profile.avatarSeed)
      setChismes(prev => [nuevo, ...prev])
      setTexto('')
      toast.success('Chisme publicado.')
    } catch {
      toast.error('No se pudo publicar.')
    } finally {
      setSending(false)
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
    toast.success('Reposteado.')
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-black text-[#f0f0f0]">

      {/* ── Header ── */}
      <header
        style={{ height: HEADER_H }}
        className="fixed inset-x-0 top-0 z-20 bg-black border-b border-[#181818]"
      >
        <div className="h-full max-w-[600px] mx-auto px-4 flex items-center justify-between">
          <span className="text-[20px] font-black tracking-tighter text-white">CHISMÓGRAFO</span>
          <nav className="flex items-center gap-5">
            <button
              className="text-[11px] font-bold uppercase tracking-widest border-b-2 pb-0.5"
              style={{ color: BRAND, borderColor: BRAND }}
            >
              Feed
            </button>
            <button
              onClick={() => startTransition(() => router.push('/trending'))}
              className="text-[11px] font-bold uppercase tracking-widest text-[#404040] border-b-2 border-transparent pb-0.5 hover:text-white transition-colors"
            >
              Trending
            </button>
          </nav>
          <motion.button
            onClick={() => { clearProfile(); router.replace('/setup') }}
            whileTap={{ scale: 0.9 }}
          >
            <ViewTransition name="user-avatar">
              <Avatar seed={profile.avatarSeed} size={28} className="overflow-hidden" style={{ borderRadius: 0 }} />
            </ViewTransition>
          </motion.button>
        </div>
      </header>

      <div style={{ height: HEADER_H }} />

      <div className="max-w-[600px] mx-auto">

        {/* ── Compose ── */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onSubmit={handlePost}
          className="px-4 pt-5 pb-4 border-b border-[#181818] flex gap-3"
        >
          <ViewTransition name="user-avatar-compose">
            <Avatar seed={profile.avatarSeed} size={36} className="overflow-hidden shrink-0 mt-0.5" style={{ borderRadius: 0 }} />
          </ViewTransition>
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <TextareaAutosize
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
              maxLength={500}
              minRows={2}
              className="w-full bg-transparent text-[15px] text-[#e0e0e0] placeholder-[#282828] resize-none outline-none leading-[1.6]"
            />
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {texto.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[11px] text-[#2a2a2a] tabular-nums"
                  >
                    {texto.length}/500
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                disabled={!texto.trim() || sending}
                whileTap={{ scale: 0.96 }}
                className="ml-auto text-[12px] font-bold uppercase tracking-widest text-black px-4 py-2 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                style={{ background: texto.trim() ? BRAND : '#1a1a1a' }}
              >
                {sending ? '…' : 'Publicar'}
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* ── Feed ── */}
        {loading ? (
          <div className="flex flex-col">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-4 border-b border-[#181818] flex gap-3">
                <motion.div
                  animate={{ opacity: [0.04, 0.1, 0.04] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }}
                  className="w-9 h-9 bg-white shrink-0"
                  style={{ borderRadius: 0 }}
                />
                <div className="flex-1 flex flex-col gap-2.5 pt-1">
                  <div className="flex justify-between">
                    <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.05 }} className="h-2 bg-white w-20" />
                    <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.05 }} className="h-2 bg-white w-8" />
                  </div>
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2 bg-white w-full" />
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.15 }} className="h-2 bg-white w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : chismes.length === 0 ? (
          <motion.div variants={slideDown} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-24">
            <p className="text-[14px] font-bold uppercase tracking-widest text-[#1c1c1c]">Sin chismes aún</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <AnimatePresence initial={false}>
              {chismes.map((c, i) => {
                const isLiked = !!liked[c.id]
                const isReposted = !!reposted[c.id]

                return (
                  <motion.div
                    key={c.id}
                    variants={i === 0 && chismes.length > 1 ? slideDown : staggerItem}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="border-b border-[#181818]"
                  >
                    <ViewTransition name={`post-${c.id}`}>
                      <article className="px-4 py-4 flex gap-3">

                        {/* Avatar cuadrado */}
                        <div className="shrink-0 mt-0.5">
                          <ViewTransition name={`avatar-${c.id}`}>
                            <Avatar seed={c.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
                          </ViewTransition>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
                            <span className="text-[11px] text-[#333]">{timeAgo(c.created_at)}</span>
                          </div>

                          {/* Texto */}
                          <p className="text-[15px] text-[#d0d0d0] leading-[1.65] whitespace-pre-wrap break-words">
                            {c.texto}
                          </p>

                          {/* Acciones — contadores grandes */}
                          <div className="flex items-center gap-5 mt-3">

                            <motion.button
                              onClick={() => handleLike(c.id)}
                              whileTap={!isLiked ? { scale: 0.85 } : undefined}
                              className="flex items-center gap-2"
                            >
                              <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                {isLiked
                                  ? <HeartSolid width={15} height={15} style={{ color: BRAND }} />
                                  : <Heart width={15} height={15} color="#404040" />
                                }
                              </motion.div>
                              <CounterFlip count={c.like_count} active={isLiked} large />
                            </motion.button>

                            <motion.button
                              onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                              whileTap={{ scale: 0.85 }}
                              className="flex items-center gap-2"
                            >
                              <MessageText width={15} height={15} color="#404040" />
                              <CounterFlip count={c.comment_count} active={false} large />
                            </motion.button>

                            <motion.button
                              onClick={() => handleRepost(c.id)}
                              whileTap={!isReposted ? { scale: 0.85 } : undefined}
                              className="flex items-center gap-2"
                            >
                              <motion.div animate={{ rotate: isReposted ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                <Refresh width={15} height={15} color={isReposted ? BRAND : '#404040'} />
                              </motion.div>
                              <CounterFlip count={c.repost_count} active={isReposted} large />
                            </motion.button>

                          </div>
                        </div>
                      </article>
                    </ViewTransition>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Sentinel para infinite scroll */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex justify-center py-6">
                <motion.div
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#282828]"
                >
                  Cargando…
                </motion.div>
              </div>
            )}

            {!hasMore && chismes.length > 0 && (
              <p className="text-center text-[11px] font-bold uppercase tracking-widest text-[#181818] py-8">
                — fin —
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

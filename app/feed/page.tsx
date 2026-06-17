'use client'

import { useEffect, useState, useRef, startTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, Plus, Minus } from 'iconoir-react'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import {
  getChismes, postChisme, darLike, darRepost,
  getCuestionarios, postCuestionario,
  type Chisme, type Cuestionario,
} from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import CuestionarioCard from '@/components/CuestionarioCard'
import AnswerPanel from '@/components/AnswerPanel'
import TextareaAutosize from 'react-textarea-autosize'
import { staggerContainer, staggerItem, slideDown } from '@/lib/variants'

const BRAND = '#39e079'
const HEADER_H = 56

type ComposeMode = 'chisme' | 'cuestionario'
type FeedItem =
  | { type: 'chisme'; data: Chisme }
  | { type: 'cuestionario'; data: Cuestionario }

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
    .replace('alrededor de ', '').replace('menos de ', '')
    .replace(' minutos', 'm').replace(' minuto', 'm')
    .replace(' horas', 'h').replace(' hora', 'h')
    .replace(' días', 'd').replace(' día', 'd')
    .replace(' meses', 'mo').replace(' mes', 'mo')
}

function mergeFeed(chismes: Chisme[], cuestionarios: Cuestionario[]): FeedItem[] {
  return [
    ...chismes.map(c => ({ type: 'chisme' as const, data: c })),
    ...cuestionarios.map(c => ({ type: 'cuestionario' as const, data: c })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
}

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([])

  // Compose
  const [composeMode, setComposeMode] = useState<ComposeMode>('chisme')
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  // Cuestionario compose
  const [titulo, setTitulo] = useState('')
  const [preguntas, setPreguntas] = useState<string[]>(['', ''])

  // Feed loading
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Interactions
  const [liked, setLiked] = useState<Record<string, true>>({})
  const [reposted, setReposted] = useState<Record<string, true>>({})
  const [answered, setAnswered] = useState<string[]>([])

  // Panel
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' })

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setLiked(getLS('chismografo_liked', {}))
    setReposted(getLS('chismografo_reposted', {}))
    setAnswered(getLS('chismografo_answered', []))
    loadInitial()
  }, [router])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const [chismesRes, cuestionariosRes] = await Promise.all([
        getChismes(1),
        getCuestionarios(),
      ])
      setChismes(chismesRes.data)
      setHasMore(chismesRes.hasMore)
      setPage(1)
      setCuestionarios(cuestionariosRes)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async (p: number) => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await getChismes(p)
      setChismes(prev => [...prev, ...res.data])
      setHasMore(res.hasMore)
      setPage(p)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore])

  useEffect(() => {
    if (inView && !loading && !loadingMore && hasMore) {
      loadMore(page + 1)
    }
  }, [inView, loading, loadingMore, hasMore, page, loadMore])

  // Lock body scroll when panel is open
  useEffect(() => {
    if (activePanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activePanel])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePostChisme(e: React.FormEvent) {
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

  async function handlePostCuestionario(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || preguntas.every(p => !p.trim()) || sending || !profile) return
    const preguntasValidas = preguntas.filter(p => p.trim())
    if (preguntasValidas.length < 1) { toast.error('Agrega al menos una pregunta.'); return }
    setSending(true)
    try {
      const nuevo = await postCuestionario(titulo.trim(), preguntasValidas, profile.username, profile.avatarSeed)
      setCuestionarios(prev => [nuevo, ...prev])
      setTitulo('')
      setPreguntas(['', ''])
      setComposeMode('chisme')
      toast.success('Cuestionario publicado.')
    } catch {
      toast.error('No se pudo publicar.')
    } finally {
      setSending(false)
    }
  }

  function addPregunta() {
    if (preguntas.length >= 10) return
    setPreguntas(prev => [...prev, ''])
  }

  function removePregunta(i: number) {
    if (preguntas.length <= 1) return
    setPreguntas(prev => prev.filter((_, idx) => idx !== i))
  }

  function updatePregunta(i: number, val: string) {
    setPreguntas(prev => prev.map((p, idx) => idx === i ? val : p))
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

  function openPanel(id: string) {
    // Refresh answered list
    setAnswered(getLS('chismografo_answered', []))
    setActivePanel(id)
  }

  function closePanel() {
    setActivePanel(null)
    // Refresh cuestionarios to get updated counts
    getCuestionarios().then(setCuestionarios)
  }

  if (!profile) return null

  const feed = mergeFeed(chismes, cuestionarios)

  return (
    <div className="min-h-screen bg-black text-[#f0f0f0] overflow-x-hidden">

      {/* ── Feed wrapper — shifts left when panel opens ── */}
      <motion.div
        animate={{
          x: activePanel ? '-18vw' : 0,
          opacity: activePanel ? 0.35 : 1,
          scale: activePanel ? 0.97 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        style={{ transformOrigin: 'left center' }}
      >
        {/* Header */}
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

          {/* ── Compose area ── */}
          <div className="border-b border-[#181818]">

            {/* Mode toggle */}
            <div className="flex border-b border-[#181818]">
              <button
                onClick={() => setComposeMode('chisme')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${composeMode === 'chisme' ? 'text-white border-b-2 border-white' : 'text-[#333]'}`}
              >
                Chisme
              </button>
              <button
                onClick={() => setComposeMode('cuestionario')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${composeMode === 'cuestionario' ? 'text-white border-b-2 border-white' : 'text-[#333]'}`}
                style={composeMode === 'cuestionario' ? { color: BRAND, borderColor: BRAND } : undefined}
              >
                Cuestionario
              </button>
            </div>

            <AnimatePresence mode="wait">
              {composeMode === 'chisme' ? (
                <motion.form
                  key="chisme-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handlePostChisme}
                  className="px-4 pt-4 pb-4 flex gap-3"
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
                          if (texto.trim() && !sending) handlePostChisme(e as unknown as React.FormEvent)
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
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-[#2a2a2a] tabular-nums">
                            {texto.length}/500
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <motion.button
                        type="submit"
                        disabled={!texto.trim() || sending}
                        whileTap={{ scale: 0.96 }}
                        className="ml-auto text-[12px] font-black uppercase tracking-widest text-black px-4 py-2 disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ background: texto.trim() ? '#f0f0f0' : '#1a1a1a' }}
                      >
                        {sending ? '…' : 'Publicar'}
                      </motion.button>
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="cuestionario-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handlePostCuestionario}
                  className="px-4 pt-4 pb-4 flex gap-3"
                >
                  <Avatar seed={profile.avatarSeed} size={36} className="overflow-hidden shrink-0 mt-0.5" style={{ borderRadius: 0 }} />
                  <div className="flex-1 min-w-0 flex flex-col gap-3">

                    {/* Title */}
                    <input
                      type="text"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      placeholder="Título del cuestionario…"
                      maxLength={100}
                      className="w-full bg-transparent text-[16px] font-black text-white placeholder-[#282828] outline-none border-b border-[#1c1c1c] pb-2 focus:border-[#404040] transition-colors"
                    />

                    {/* Questions */}
                    <div className="flex flex-col gap-2.5">
                      {preguntas.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#282828] w-4 shrink-0 tabular-nums">{i + 1}</span>
                          <input
                            type="text"
                            value={p}
                            onChange={e => updatePregunta(i, e.target.value)}
                            placeholder={`Pregunta ${i + 1}…`}
                            maxLength={150}
                            className="flex-1 bg-transparent text-[13px] text-[#d0d0d0] placeholder-[#252525] outline-none border-b border-[#181818] pb-1.5 focus:border-[#404040] transition-colors"
                          />
                          {preguntas.length > 1 && (
                            <button type="button" onClick={() => removePregunta(i)} className="p-0.5 shrink-0">
                              <Minus width={12} height={12} color="#333" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add question + Publish */}
                    <div className="flex items-center justify-between">
                      {preguntas.length < 10 ? (
                        <button
                          type="button"
                          onClick={addPregunta}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#333] hover:text-white transition-colors"
                        >
                          <Plus width={12} height={12} />
                          Pregunta
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#222]">Máx. 10</span>
                      )}

                      <motion.button
                        type="submit"
                        disabled={!titulo.trim() || preguntas.every(p => !p.trim()) || sending}
                        whileTap={{ scale: 0.96 }}
                        className="text-[12px] font-black uppercase tracking-widest text-black px-4 py-2 disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ background: titulo.trim() ? BRAND : '#1a1a1a', color: titulo.trim() ? '#000' : '#333' }}
                      >
                        {sending ? '…' : 'Publicar'}
                      </motion.button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ── Feed ── */}
          {loading ? (
            <div className="flex flex-col">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-4 py-4 border-b border-[#181818] flex gap-3">
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="w-9 h-9 bg-white shrink-0" style={{ borderRadius: 0 }} />
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
          ) : feed.length === 0 ? (
            <motion.div variants={slideDown} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-24">
              <p className="text-[14px] font-bold uppercase tracking-widest text-[#1c1c1c]">Sin chismes aún</p>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <AnimatePresence initial={false}>
                {feed.map((item, i) => (
                  item.type === 'chisme' ? (
                    <motion.div
                      key={`chisme-${item.data.id}`}
                      variants={i === 0 && feed.length > 1 ? slideDown : staggerItem}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0 }}
                      className="border-b border-[#181818]"
                    >
                      <ViewTransition name={`post-${item.data.id}`}>
                        <article className="px-4 py-4 flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            <ViewTransition name={`avatar-${item.data.id}`}>
                              <Avatar seed={item.data.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
                            </ViewTransition>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-white">{item.data.username}</span>
                              <span className="text-[11px] text-[#333]">{timeAgo(item.data.created_at)}</span>
                            </div>
                            <p className="text-[15px] text-[#d0d0d0] leading-[1.65] whitespace-pre-wrap break-words">
                              {item.data.texto}
                            </p>
                            <div className="flex items-center gap-5 mt-3">
                              <motion.button onClick={() => handleLike(item.data.id)} whileTap={!liked[item.data.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={liked[item.data.id] ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                  {liked[item.data.id]
                                    ? <HeartSolid width={15} height={15} style={{ color: BRAND }} />
                                    : <Heart width={15} height={15} color="#404040" />
                                  }
                                </motion.div>
                                <CounterFlip count={item.data.like_count} active={!!liked[item.data.id]} large />
                              </motion.button>
                              <motion.button onClick={() => startTransition(() => router.push(`/chisme/${item.data.id}`))} whileTap={{ scale: 0.85 }} className="flex items-center gap-2">
                                <MessageText width={15} height={15} color="#404040" />
                                <CounterFlip count={item.data.comment_count} active={false} large />
                              </motion.button>
                              <motion.button onClick={() => handleRepost(item.data.id)} whileTap={!reposted[item.data.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={{ rotate: reposted[item.data.id] ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                  <Refresh width={15} height={15} color={reposted[item.data.id] ? BRAND : '#404040'} />
                                </motion.div>
                                <CounterFlip count={item.data.repost_count} active={!!reposted[item.data.id]} large />
                              </motion.button>
                            </div>
                          </div>
                        </article>
                      </ViewTransition>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`cuestionario-${item.data.id}`}
                      variants={staggerItem}
                      initial="hidden"
                      animate="show"
                    >
                      <CuestionarioCard
                        cuestionario={item.data}
                        onParticipate={openPanel}
                        alreadyAnswered={answered.includes(item.data.id)}
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              <div ref={sentinelRef} className="h-1" />

              {loadingMore && (
                <div className="flex justify-center py-6">
                  <motion.div animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-[11px] font-bold uppercase tracking-widest text-[#282828]">
                    Cargando…
                  </motion.div>
                </div>
              )}

              {!hasMore && chismes.length > 0 && (
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-[#181818] py-8">— fin —</p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Answer Panel — slides in from right ── */}
      <AnimatePresence>
        {activePanel && (
          <>
            {/* Tap backdrop to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={closePanel}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
              className="fixed inset-y-0 right-0 z-40 bg-black border-l border-[#181818] overflow-hidden"
              style={{ width: '82vw', maxWidth: 480 }}
            >
              <AnswerPanel
                cuestionarioId={activePanel}
                profile={profile}
                onClose={closePanel}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

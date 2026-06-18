'use client'

import { useEffect, useState, useRef, startTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, Notes, FireFlame, Search, Xmark } from 'iconoir-react'
import { useInView } from 'react-intersection-observer'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, type Profile } from '@/lib/profile'
import {
  getChismes, postChisme, darLike, darRepost,
  getCuestionarios, searchChismes,
  type Chisme, type Cuestionario,
} from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import CuestionarioCard from '@/components/CuestionarioCard'
import AnswerPanel from '@/components/AnswerPanel'
import RepostModal from '@/components/RepostModal'
import TextareaAutosize from 'react-textarea-autosize'
import { staggerContainer, staggerItem, slideDown } from '@/lib/variants'
import { fireConfetti } from '@/lib/confetti'

const BRAND = '#39e079'

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
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

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
  const [repostTarget, setRepostTarget] = useState<Chisme | null>(null)

  // Search
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Chisme[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [debouncedQuery] = useDebounce(query, 350)

  // Anon
  const [anon, setAnon] = useState(false)

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchMove(e: React.TouchEvent) {
    if (refreshing) return
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setPullY(Math.min(delta * 0.4, 64))
  }
  async function onTouchEnd() {
    if (pullY > 48 && !refreshing) {
      setRefreshing(true)
      setPullY(0)
      await loadInitial()
      setRefreshing(false)
    } else {
      setPullY(0)
    }
  }

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

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    searchChismes(debouncedQuery.trim())
      .then(setSearchResults)
      .finally(() => setSearchLoading(false))
  }, [debouncedQuery])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePostChisme(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending || !profile) return
    setSending(true)
    const username = anon ? 'anónimo' : profile.username
    const avatarSeed = anon ? `anon-${Date.now()}` : profile.avatarSeed
    try {
      const nuevo = await postChisme(texto.trim(), username, avatarSeed)
      setChismes(prev => [nuevo, ...prev])
      if (anon) setAnon(false)
      setTexto('')
      fireConfetti()
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

  function handleRepost(chisme: Chisme) {
    setRepostTarget(chisme)
  }

  async function handleRepostConfirm(id: string) {
    if (reposted[id]) return
    const next = { ...reposted, [id]: true as const }
    setReposted(next); setLS('chismografo_reposted', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, repost_count: c.repost_count + 1 } : c))
    await darRepost(id)
    fireConfetti()
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
    <div className="h-full flex overflow-hidden">

      {/* ── Feed column ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">

        {/* Scrollable feed body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Pull to refresh indicator */}
          <AnimatePresence>
            {(pullY > 0 || refreshing) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: refreshing ? 44 : pullY, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden flex items-center justify-center"
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : { rotate: pullY * 3 }}
                  transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : { duration: 0 }}
                  style={{ color: BRAND }}
                >
                  <Refresh width={18} height={18} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="max-w-[600px] mx-auto">

            {/* ── Page title + search toggle ── */}
            <div className="px-4 py-6 border-b border-[#181818] flex items-center gap-4">
              <FireFlame width={28} height={28} style={{ color: BRAND }} />
              <span className="text-[42px] font-black uppercase tracking-tighter leading-none text-white flex-1">
                Feed
              </span>
              <motion.button
                onClick={() => { setSearchOpen(v => !v); if (searchOpen) { setQuery(''); setSearchResults([]) } }}
                whileTap={{ scale: 0.88 }}
                className="p-2 hover:bg-white/[0.05] transition-colors"
                style={{ color: searchOpen ? BRAND : '#404040' }}
              >
                {searchOpen ? <Xmark width={20} height={20} /> : <Search width={20} height={20} />}
              </motion.button>
            </div>

            {/* ── Search bar ── */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 52, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-[#181818]"
                >
                  <div className="h-full px-4 flex items-center gap-3">
                    <Search width={14} height={14} color="#383838" />
                    <input
                      autoFocus
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Buscar chismes…"
                      className="flex-1 bg-transparent text-[14px] text-[#e0e0e0] placeholder-[#282828] outline-none"
                    />
                    {query && (
                      <motion.button onClick={() => setQuery('')} whileTap={{ scale: 0.88 }}>
                        <Xmark width={14} height={14} color="#383838" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Compose area ── */}
            <div className="border-b border-[#181818]">
              <form onSubmit={handlePostChisme}>
                {/* Textarea row */}
                <div className="px-4 pt-4 pb-2 flex gap-3">
                  <ViewTransition name="user-avatar-compose">
                    <Avatar seed={profile.avatarSeed} size={36} className="overflow-hidden shrink-0 mt-1" style={{ borderRadius: 0 }} />
                  </ViewTransition>
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
                    className="flex-1 bg-transparent text-[15px] text-[#e0e0e0] placeholder-[#282828] resize-none outline-none leading-[1.6]"
                  />
                </div>

                {/* Action row */}
                <div className="px-4 pb-3 flex items-center justify-between border-t border-[#111]">
                  <div className="flex items-center gap-3">
                    <AnimatePresence>
                      {texto.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-[11px] tabular-nums font-medium"
                          style={{ color: texto.length > 450 ? '#e06030' : '#444' }}
                        >
                          {texto.length}/500
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.button
                      type="button"
                      onClick={() => setAnon(v => !v)}
                      whileTap={{ scale: 0.88 }}
                      animate={{ color: anon ? BRAND : '#333' }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border transition-colors"
                      style={{ borderColor: anon ? BRAND : '#1c1c1c' }}
                    >
                      Anón
                    </motion.button>
                  </div>
                  <div className="ml-auto flex items-center gap-2 pr-1">
                    <AnimatePresence>
                      {texto.trim() && (
                        <motion.button
                          type="button"
                          onClick={() => startTransition(() => router.push('/cuestionario/nuevo'))}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          whileTap={{ scale: 0.88 }}
                          title="Crear cuestionario"
                          className="p-2 hover:bg-white/[0.05] transition-colors"
                          style={{ color: BRAND }}
                        >
                          <Notes width={18} height={18} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <motion.button
                      type="submit"
                      disabled={!texto.trim() || sending}
                      whileTap={texto.trim() ? { scale: 0.96 } : undefined}
                      animate={{
                        background: texto.trim() ? BRAND : '#141414',
                        color: texto.trim() ? '#000' : '#282828',
                      }}
                      transition={{ duration: 0.18 }}
                      className="text-[12px] font-black uppercase tracking-widest px-6 py-2 disabled:cursor-not-allowed shrink-0"
                    >
                      {sending ? '…' : 'Publicar'}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>

            {/* ── Search results ── */}
            <AnimatePresence>
              {searchOpen && debouncedQuery.trim() && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-[#181818]"
                >
                  {searchLoading ? (
                    <div className="py-8 text-center text-[11px] font-bold uppercase tracking-widest text-[#282828]">Buscando…</div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">Sin resultados.</div>
                  ) : (
                    searchResults.map(c => (
                      <div key={c.id} className="px-4 py-4 border-b border-[#181818] flex gap-3 cursor-pointer hover:bg-white/[0.02]"
                        onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}>
                        <Avatar seed={c.avatar_seed} size={32} className="overflow-hidden shrink-0" style={{ borderRadius: 0 }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
                          <p className="text-[14px] text-[#d0d0d0] leading-[1.6] mt-1">{c.texto}</p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
                                <motion.button onClick={() => handleRepost(item.data)} whileTap={!reposted[item.data.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
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
                          isActive={activePanel === item.data.id}
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
        </div>
      </div>

      {/* ── Panel column — second feed, same level ── */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            key="answer-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '48%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            className="shrink-0 h-screen border-l border-[#1e1e1e] overflow-hidden bg-black relative"
            style={{ maxWidth: 520 }}
          >
            <AnswerPanel
              cuestionarioId={activePanel}
              profile={profile}
              onClose={closePanel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Repost modal ── */}
      <RepostModal
        chisme={repostTarget}
        profile={profile}
        isReposted={repostTarget ? !!reposted[repostTarget.id] : false}
        onClose={() => setRepostTarget(null)}
        onConfirm={handleRepostConfirm}
      />
    </div>
  )
}

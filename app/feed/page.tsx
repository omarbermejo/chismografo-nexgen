'use client'

import { useEffect, useState, useRef, startTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, Notes, EditPencil, Search, Xmark, EyeClosed } from 'iconoir-react'
import { useInView } from 'react-intersection-observer'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, type Profile } from '@/lib/profile'
import {
  getChismes, postChisme, darLike, darRepost,
  getCuestionarios, searchChismes, getReposts,
  type Chisme, type Cuestionario, type RepostItem,
} from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import CuestionarioCard from '@/components/CuestionarioCard'
import RepostModal from '@/components/RepostModal'
import PaperNote from '@/components/PaperNote'
import SecretText from '@/components/SecretText'
import BookmarkButton from '@/components/BookmarkButton'
import TextareaAutosize from 'react-textarea-autosize'
import { staggerContainer, staggerItem, slideDown } from '@/lib/variants'
import { fireConfetti } from '@/lib/confetti'

type FeedItem =
  | { type: 'chisme'; data: Chisme }
  | { type: 'cuestionario'; data: Cuestionario }
  | { type: 'repost'; data: RepostItem }

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

function mergeFeed(chismes: Chisme[], cuestionarios: Cuestionario[], reposts: RepostItem[]): FeedItem[] {
  return [
    ...chismes.map(c => ({ type: 'chisme' as const, data: c })),
    ...cuestionarios.map(c => ({ type: 'cuestionario' as const, data: c })),
    ...reposts.map(r => ({ type: 'repost' as const, data: r })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
}

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([])
  const [reposts, setReposts] = useState<RepostItem[]>([])

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

  // Repost
  const [repostTarget, setRepostTarget] = useState<Chisme | null>(null)

  // Search
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Chisme[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [debouncedQuery] = useDebounce(query, 350)

  // Anón + secreto
  const [anon, setAnon] = useState(false)
  const [secret, setSecret] = useState(false)

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
      const [chismesRes, cuestionariosRes, repostsRes] = await Promise.all([
        getChismes(1),
        getCuestionarios(),
        getReposts(),
      ])
      setChismes(chismesRes.data)
      setHasMore(chismesRes.hasMore)
      setPage(1)
      setCuestionarios(cuestionariosRes)
      setReposts(repostsRes)
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
    const esSecreto = secret
    try {
      const nuevo = await postChisme(texto.trim(), username, avatarSeed, esSecreto)
      setChismes(prev => [nuevo, ...prev])
      if (anon) setAnon(false)
      setSecret(false)
      setTexto('')
      fireConfetti()
      toast.success(esSecreto ? 'queda tapado. 🤫' : 'queda escrito. 🤫')
    } catch {
      toast.error('No se pudo escribir. Inténtalo otra vez.')
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

  async function handleRepostConfirm(id: string, texto?: string) {
    if (reposted[id] || !profile) return
    const next = { ...reposted, [id]: true as const }
    setReposted(next); setLS('chismografo_reposted', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, repost_count: c.repost_count + 1 } : c))

    // Insertar el repost en el feed de forma optimista
    const original = repostTarget && repostTarget.id === id
      ? repostTarget
      : chismes.find(c => c.id === id)
    if (original) {
      const optimistic: RepostItem = {
        id: `local-${id}-${Date.now()}`,
        created_at: new Date().toISOString(),
        username: profile.username,
        avatar_seed: profile.avatarSeed,
        texto: texto ?? null,
        chisme: { ...original, repost_count: original.repost_count + 1 },
      }
      setReposts(prev => [optimistic, ...prev])
    }

    await darRepost(id, profile.username, profile.avatarSeed, texto)
    fireConfetti()
    toast.success('se lo pasaste a todos.')
  }

  function openCuestionario(id: string) {
    startTransition(() => router.push(`/cuestionario/${id}`))
  }

  if (!profile) return null

  const feed = mergeFeed(chismes, cuestionarios, reposts)

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Columna del cuaderno ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto ruled"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Pull to refresh */}
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
                  style={{ color: 'var(--highlight)' }}
                >
                  <Refresh width={18} height={18} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-[600px] mx-auto">

            {/* ── Etiqueta de la tapa: título ⇄ búsqueda ── */}
            <div className="px-4 py-6 border-b border-line flex items-center gap-4 bg-paper">
              <EditPencil width={26} height={26} style={{ color: 'var(--highlight)' }} className="shrink-0" />

              <div className="flex-1 min-w-0 relative h-[44px] flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                  {searchOpen ? (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, scaleX: 0.6 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.6 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      style={{ originX: 0 }}
                      className="absolute inset-0 flex items-center gap-3"
                    >
                      <Search width={18} height={18} color="var(--ink-soft)" className="shrink-0" />
                      <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); setSearchResults([]) }
                        }}
                        placeholder="busca el chisme…"
                        className="flex-1 min-w-0 bg-transparent font-hand text-[24px] text-ink placeholder-ink-faint outline-none"
                      />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="title"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-0 flex items-center font-hand-title text-[40px] leading-none text-ink"
                    >
                      Chismógrafo
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={() => { setSearchOpen(v => !v); if (searchOpen) { setQuery(''); setSearchResults([]) } }}
                whileTap={{ scale: 0.88 }}
                animate={{ rotate: searchOpen ? 90 : 0 }}
                style={{ color: searchOpen ? 'var(--highlight)' : 'var(--ink-soft)', transition: 'color 0.2s' }}
                transition={{ duration: 0.2 }}
                className="p-2 hover:bg-[var(--state-hover)] transition-colors shrink-0"
              >
                {searchOpen ? <Xmark width={22} height={22} /> : <Search width={22} height={22} />}
              </motion.button>
            </div>

            {/* ── Compose ── */}
            <div className="px-3 pt-4">
              <PaperNote seed="compose" tape className="px-4 pt-4 pb-3">
                <form onSubmit={handlePostChisme}>
                  <div className="flex gap-3 pb-2">
                    <ViewTransition name="user-avatar-compose">
                      <Avatar seed={profile.avatarSeed} size={38} frame="tape" className="shrink-0 mt-1" />
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
                      placeholder="escribe el chisme…"
                      maxLength={500}
                      minRows={2}
                      className="flex-1 bg-transparent font-hand text-[20px] text-ink placeholder-ink-faint resize-none outline-none leading-[1.5]"
                      style={secret ? { textDecoration: 'underline', textDecorationColor: 'var(--ink-soft)', textDecorationThickness: '8px', textUnderlineOffset: '-3px' } : undefined}
                    />
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <div className="flex items-center gap-2">
                      <AnimatePresence>
                        {texto.length > 0 && (
                          <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-[11px] tabular-nums font-mono"
                            style={{ color: texto.length > 450 ? 'var(--state-error)' : 'var(--ink-faint)' }}
                          >
                            {texto.length}/500
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <motion.button
                        type="button"
                        onClick={() => setAnon(v => !v)}
                        whileTap={{ scale: 0.88 }}
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border transition-colors"
                        style={{ color: anon ? 'var(--highlight-ink)' : 'var(--ink-soft)', background: anon ? 'var(--highlight)' : 'transparent', borderColor: anon ? 'var(--highlight)' : 'var(--border)' }}
                      >
                        anón
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setSecret(v => !v)}
                        whileTap={{ scale: 0.88 }}
                        title="tápalo: solo se revela al tocar"
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 border transition-colors"
                        style={{ color: secret ? 'var(--marker-ink)' : 'var(--ink-soft)', background: secret ? 'var(--marker)' : 'transparent', borderColor: secret ? 'var(--marker)' : 'var(--border)' }}
                      >
                        <EyeClosed width={12} height={12} />
                        tápalo
                      </motion.button>
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-0.5">
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
                            title="pasa una hoja (cuestionario)"
                            className="p-2 hover:bg-[var(--state-hover)] transition-colors"
                            style={{ color: 'var(--highlight)' }}
                          >
                            <Notes width={18} height={18} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      <motion.button
                        type="submit"
                        disabled={!texto.trim() || sending}
                        whileTap={texto.trim() ? { scale: 0.96 } : undefined}
                        className="text-[12px] font-black uppercase tracking-widest px-6 py-2 disabled:cursor-not-allowed shrink-0 transition-colors"
                        style={{
                          background: texto.trim() ? 'var(--highlight)' : 'var(--state-disabled-bg)',
                          color: texto.trim() ? 'var(--highlight-ink)' : 'var(--state-disabled-ink)',
                        }}
                      >
                        {sending ? '…' : 'pégalo'}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </PaperNote>
            </div>

            {/* ── Resultados de búsqueda ── */}
            <AnimatePresence>
              {searchOpen && debouncedQuery.trim() && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-line overflow-hidden mt-2"
                >
                  <AnimatePresence mode="wait">
                    {searchLoading ? (
                      <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="relative h-[2px] w-full overflow-hidden bg-paper-sunken">
                          <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '400%' }}
                            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                            className="absolute inset-y-0 w-1/4"
                            style={{ background: `linear-gradient(to right, transparent, var(--highlight), transparent)` }}
                          />
                        </div>
                        <div className="py-7 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-soft">
                          buscando
                          {[0, 1, 2].map(i => (
                            <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }} style={{ color: 'var(--highlight)' }}>·</motion.span>
                          ))}
                        </div>
                      </motion.div>
                    ) : searchResults.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        className="py-8 text-center font-hand text-[16px] text-ink-faint">
                        nada por aquí. ¿lo escribiste bien?
                      </motion.div>
                    ) : (
                      <motion.div key="results" variants={staggerContainer} initial="hidden" animate="show">
                        {searchResults.map(c => (
                          <motion.div
                            key={c.id}
                            variants={staggerItem}
                            onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                            className="px-4 py-4 border-b border-line flex gap-3 cursor-pointer hover:bg-[var(--state-hover)] transition-colors"
                          >
                            <Avatar seed={c.avatar_seed} size={32} frame="tape" className="shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{c.username}</span>
                              <p className="font-hand text-[18px] text-ink leading-[1.4] mt-1">{c.texto}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Feed ── */}
            {loading ? (
              <div className="flex flex-col gap-4 px-3 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="note px-4 py-4 flex gap-3">
                    <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="w-9 h-9 bg-ink shrink-0" />
                    <div className="flex-1 flex flex-col gap-3 pt-1">
                      <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.05 }} className="h-2.5 bg-ink w-24" />
                      <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2.5 bg-ink w-full" />
                      <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.15 }} className="h-2.5 bg-ink w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <motion.div variants={slideDown} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-24">
                <p className="font-hand text-[20px] text-ink-faint">el cuaderno está en blanco… empieza tú.</p>
              </motion.div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4 px-3 py-4">
                <AnimatePresence initial={false}>
                  {feed.map((item, i) => (
                    item.type === 'chisme' ? (
                      <motion.div
                        key={`chisme-${item.data.id}`}
                        variants={i === 0 && feed.length > 1 ? slideDown : staggerItem}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                      >
                        <ViewTransition name={`post-${item.data.id}`}>
                          <PaperNote seed={item.data.id} tape>
                            <article className="px-4 py-4 flex gap-3">
                              <div className="shrink-0 mt-0.5">
                                <ViewTransition name={`avatar-${item.data.id}`}>
                                  <Avatar seed={item.data.avatar_seed} size={38} frame="tape" />
                                </ViewTransition>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{item.data.username}</span>
                                  <span className="text-[11px] text-ink-faint font-mono">{timeAgo(item.data.created_at)}</span>
                                </div>
                                {item.data.secreto ? (
                                  <SecretText text={item.data.texto} className="font-hand text-[20px] text-ink leading-[1.45] whitespace-pre-wrap break-words" />
                                ) : (
                                  <p className="font-hand text-[20px] text-ink leading-[1.45] whitespace-pre-wrap break-words">
                                    {item.data.texto}
                                  </p>
                                )}
                                <div className="flex items-center gap-5 mt-3">
                                  <motion.button onClick={() => handleLike(item.data.id)} whileTap={!liked[item.data.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                    <motion.div animate={liked[item.data.id] ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                      {liked[item.data.id]
                                        ? <HeartSolid width={15} height={15} style={{ color: 'var(--highlight)' }} />
                                        : <Heart width={15} height={15} color="var(--ink-soft)" />
                                      }
                                    </motion.div>
                                    <CounterFlip count={item.data.like_count} active={!!liked[item.data.id]} large />
                                  </motion.button>
                                  <motion.button onClick={() => startTransition(() => router.push(`/chisme/${item.data.id}`))} whileTap={{ scale: 0.85 }} className="flex items-center gap-2">
                                    <MessageText width={15} height={15} color="var(--ink-soft)" />
                                    <CounterFlip count={item.data.comment_count} active={false} large />
                                  </motion.button>
                                  <motion.button onClick={() => handleRepost(item.data)} whileTap={!reposted[item.data.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                    <motion.div animate={{ rotate: reposted[item.data.id] ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                      <Refresh width={15} height={15} color={reposted[item.data.id] ? 'var(--highlight)' : 'var(--ink-soft)'} />
                                    </motion.div>
                                    <CounterFlip count={item.data.repost_count} active={!!reposted[item.data.id]} large />
                                  </motion.button>
                                  <BookmarkButton chisme={item.data} />
                                </div>
                              </div>
                            </article>
                          </PaperNote>
                        </ViewTransition>
                      </motion.div>
                    ) : item.type === 'repost' ? (
                      <motion.div
                        key={`repost-${item.data.id}`}
                        variants={staggerItem}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                      >
                        <PaperNote seed={item.data.id}>
                          <article className="px-4 pt-3 pb-4">
                            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-widest text-ink-soft">
                              <Refresh width={12} height={12} style={{ color: 'var(--highlight)' }} />
                              <span>{item.data.username} lo pasó</span>
                              <span className="text-ink-faint ml-auto font-mono normal-case tracking-normal text-[11px]">{timeAgo(item.data.created_at)}</span>
                            </div>

                            {item.data.texto && (
                              <p className="font-hand text-[19px] text-ink leading-[1.45] whitespace-pre-wrap break-words mb-3">
                                {item.data.texto}
                              </p>
                            )}

                            <div
                              onClick={() => startTransition(() => router.push(`/chisme/${item.data.chisme.id}`))}
                              className="border border-line bg-paper px-3 py-3 flex gap-3 cursor-pointer hover:bg-[var(--state-hover)] transition-colors"
                            >
                              <Avatar seed={item.data.chisme.avatar_seed} size={28} frame="tape" className="shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{item.data.chisme.username}</span>
                                  <span className="text-[11px] text-ink-faint font-mono">{timeAgo(item.data.chisme.created_at)}</span>
                                </div>
                                <p className="font-hand text-[17px] text-ink-soft leading-[1.4] whitespace-pre-wrap break-words">{item.data.chisme.texto}</p>
                              </div>
                            </div>
                          </article>
                        </PaperNote>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`cuestionario-${item.data.id}`}
                        variants={staggerItem}
                        initial="hidden"
                        animate="show"
                      >
                        <PaperNote seed={item.data.id}>
                          <CuestionarioCard
                            cuestionario={item.data}
                            onParticipate={openCuestionario}
                            alreadyAnswered={answered.includes(item.data.id)}
                          />
                        </PaperNote>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>

                <div ref={sentinelRef} className="h-1" />

                {loadingMore && (
                  <div className="flex justify-center py-6">
                    <motion.div animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                      pasando hoja…
                    </motion.div>
                  </div>
                )}

                {!hasMore && chismes.length > 0 && (
                  <p className="text-center font-hand text-[16px] text-ink-faint py-8">se acabó el cuaderno por hoy.</p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

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

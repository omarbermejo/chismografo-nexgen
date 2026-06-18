'use client'

import { useEffect, useState, useRef, startTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, ArrowLeft } from 'iconoir-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, type Profile } from '@/lib/profile'
import { getChisme, getComentarios, postComentario, darLike, darRepost, type Chisme, type Comentario } from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import PaperNote from '@/components/PaperNote'
import SecretText from '@/components/SecretText'
import { staggerContainer, staggerItem } from '@/lib/variants'

const HEADER_H = 56 // used for header height
const COMPOSE_H = 68

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
}

export default function ChismePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [chisme, setChisme] = useState<Chisme | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Record<string, true>>({})
  const [reposted, setReposted] = useState<Record<string, true>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setLiked(getLS('chismografo_liked', {}))
    setReposted(getLS('chismografo_reposted', {}))
    Promise.all([getChisme(id), getComentarios(id)])
      .then(([c, cms]) => { setChisme(c); setComentarios(cms) })
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleLike() {
    if (!chisme || liked[chisme.id]) return
    const next = { ...liked, [chisme.id]: true as const }
    setLiked(next); setLS('chismografo_liked', next)
    setChisme(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev)
    await darLike(chisme.id)
  }

  async function handleRepost() {
    if (!chisme || !profile || reposted[chisme.id]) return
    const next = { ...reposted, [chisme.id]: true as const }
    setReposted(next); setLS('chismografo_reposted', next)
    setChisme(prev => prev ? { ...prev, repost_count: prev.repost_count + 1 } : prev)
    await darRepost(chisme.id, profile.username, profile.avatarSeed)
    toast.success('Reposteado.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending || !profile || !chisme) return
    setSending(true)
    try {
      const nuevo = await postComentario(chisme.id, texto.trim(), profile.username, profile.avatarSeed)
      setComentarios(prev => [...prev, nuevo])
      setChisme(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev)
      setTexto('')
    } catch {
      toast.error('No se pudo enviar.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  if (!profile) return null

  const isLiked = chisme ? !!liked[chisme.id] : false
  const isReposted = chisme ? !!reposted[chisme.id] : false
  const hasStats = chisme && (chisme.like_count > 0 || chisme.repost_count > 0 || chisme.comment_count > 0)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-paper text-ink">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ height: HEADER_H }}
        className="shrink-0 z-20 bg-paper border-b border-line"
      >
        <div className="h-full max-w-[600px] mx-auto px-3 flex items-center gap-4">
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.9 }}
            className="p-2 -ml-2 hover:bg-[var(--state-hover)] transition-colors"
          >
            <ArrowLeft width={18} height={18} color="var(--ink)" />
          </motion.button>
          <span className="text-[13px] font-black uppercase tracking-widest text-ink">un chisme</span>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto ruled">
      <div className="max-w-[600px] mx-auto px-3 pt-4" style={{ paddingBottom: COMPOSE_H + 16 }}>

        {/* ── Skeleton ── */}
        {loading ? (
          <div className="note px-4 pt-5 pb-4">
            <div className="flex gap-3 mb-4">
              <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-10 h-10 bg-ink shrink-0" />
              <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }} className="h-2.5 bg-ink w-24 mt-2" />
            </div>
            <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.15 }} className="h-3 bg-ink w-full mb-2" />
            <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.2 }} className="h-3 bg-ink w-4/5" />
          </div>
        ) : chisme ? (
          <>
            {/* ── Hoja del chisme ── */}
            <ViewTransition name={`post-${chisme.id}`}>
              <PaperNote seed={chisme.id} tape tilt={0} className="px-4 pt-5 pb-4">

                <div className="flex items-center gap-3 mb-4">
                  <ViewTransition name={`avatar-${chisme.id}`}>
                    <Avatar seed={chisme.avatar_seed} size={46} frame="polaroid" className="shrink-0" />
                  </ViewTransition>
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-widest text-ink">{chisme.username}</p>
                    <p className="text-[11px] text-ink-faint font-mono mt-0.5">{timeAgo(chisme.created_at)}</p>
                  </div>
                </div>

                {chisme.secreto ? (
                  <div className="mb-4">
                    <SecretText text={chisme.texto} className="font-hand text-[24px] text-ink leading-[1.4] whitespace-pre-wrap break-words" />
                  </div>
                ) : (
                  <p className="font-hand text-[24px] text-ink leading-[1.4] whitespace-pre-wrap break-words mb-4">
                    {chisme.texto}
                  </p>
                )}

                {/* Stats */}
                <AnimatePresence>
                  {hasStats && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="flex gap-5 pb-3 border-b border-line mb-1 font-mono"
                    >
                      {chisme.comment_count > 0 && (
                        <span className="text-[12px] text-ink-soft"><span className="text-ink font-bold">{chisme.comment_count}</span> resp.</span>
                      )}
                      {chisme.like_count > 0 && (
                        <span className="text-[12px] text-ink-soft"><span className="text-ink font-bold">{chisme.like_count}</span> likes</span>
                      )}
                      {chisme.repost_count > 0 && (
                        <span className="text-[12px] text-ink-soft"><span className="text-ink font-bold">{chisme.repost_count}</span> pasados</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Acciones */}
                <div className="flex items-center justify-around pt-1">
                  <motion.button onClick={handleLike} whileTap={!isLiked ? { scale: 0.85 } : undefined} className="flex items-center gap-2 py-2 px-3">
                    <motion.div animate={isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                      {isLiked ? <HeartSolid width={18} height={18} style={{ color: 'var(--highlight)' }} /> : <Heart width={18} height={18} color="var(--ink-soft)" />}
                    </motion.div>
                    <CounterFlip count={chisme.like_count} active={isLiked} large />
                  </motion.button>

                  <div className="flex items-center gap-2 py-2 px-3">
                    <MessageText width={18} height={18} style={{ color: 'var(--highlight)' }} />
                    <CounterFlip count={chisme.comment_count} active large />
                  </div>

                  <motion.button onClick={handleRepost} whileTap={!isReposted ? { scale: 0.85 } : undefined} className="flex items-center gap-2 py-2 px-3">
                    <motion.div animate={{ rotate: isReposted ? 360 : 0 }} transition={{ duration: 0.4 }}>
                      <Refresh width={18} height={18} color={isReposted ? 'var(--highlight)' : 'var(--ink-soft)'} />
                    </motion.div>
                    <CounterFlip count={chisme.repost_count} active={isReposted} large />
                  </motion.button>
                </div>
              </PaperNote>
            </ViewTransition>

            {/* ── Comentarios = anotaciones al margen ── */}
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-4 pl-3">
              <AnimatePresence initial={false}>
                {comentarios.map(c => (
                  <motion.div
                    key={c.id}
                    variants={staggerItem}
                    initial="hidden"
                    animate="show"
                    className="relative px-3 py-3 flex gap-3"
                  >
                    {/* Margen que conecta las anotaciones */}
                    <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: 'var(--margin)', opacity: 0.45 }} />
                    <div className="shrink-0 mt-0.5">
                      <Avatar seed={c.avatar_seed} size={30} frame="tape" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{c.username}</span>
                        <span className="text-[11px] text-ink-faint font-mono">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="font-hand text-[18px] text-ink leading-[1.4] whitespace-pre-wrap break-words">
                        {c.texto}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comentarios.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="py-10 text-center font-hand text-[18px] text-ink-faint"
                >
                  nadie ha respondido todavía. sé el primero.
                </motion.p>
              )}
            </motion.div>
          </>
        ) : (
          <p className="py-10 text-center font-hand text-[18px] text-ink-faint">
            este chisme no aparece en el cuaderno.
          </p>
        )}
      </div>
      </div>

      {/* ── Compose ── */}
      <motion.form
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        onSubmit={handleSubmit}
        style={{ height: COMPOSE_H }}
        className="shrink-0 z-20 bg-paper border-t border-line"
      >
        <div className="max-w-[600px] mx-auto h-full px-4 flex items-center gap-3">
          <Avatar seed={profile.avatarSeed} size={32} frame="tape" className="shrink-0" />
          <div className="flex-1 min-w-0">
            {chisme && !texto && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">
                para @{chisme.username}
              </p>
            )}
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (texto.trim() && !sending) handleSubmit(e as unknown as React.FormEvent)
                }
              }}
              placeholder="responde en el cuaderno…"
              maxLength={300}
              className="w-full bg-transparent font-hand text-[19px] text-ink placeholder-ink-faint outline-none"
            />
          </div>
          <AnimatePresence>
            {texto.trim() && (
              <motion.button
                type="submit"
                disabled={sending}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.92 }}
                className="text-[11px] font-black uppercase tracking-widest px-3 py-2 shrink-0 disabled:opacity-40"
                style={{ color: 'var(--highlight)' }}
              >
                {sending ? '…' : 'mándalo'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.form>
    </div>
  )
}

'use client'

import { useEffect, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, FireFlame } from 'iconoir-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, type Profile } from '@/lib/profile'
import { getTrending, darLike, darRepost, type Chisme } from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import SecretText from '@/components/SecretText'
import BookmarkButton from '@/components/BookmarkButton'
import { staggerContainer, staggerItem } from '@/lib/variants'
import RepostModal from '@/components/RepostModal'

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

export default function TrendingPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Record<string, true>>({})
  const [reposted, setReposted] = useState<Record<string, true>>({})
  const [repostTarget, setRepostTarget] = useState<Chisme | null>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setLiked(getLS('chismografo_liked', {}))
    setReposted(getLS('chismografo_reposted', {}))
    getTrending()
      .then(setChismes)
      .finally(() => setLoading(false))
  }, [router])

  async function handleLike(id: string) {
    if (liked[id]) return
    const next = { ...liked, [id]: true as const }
    setLiked(next); setLS('chismografo_liked', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, like_count: c.like_count + 1 } : c))
    await darLike(id)
  }

  async function handleRepostConfirm(id: string, texto?: string) {
    if (reposted[id] || !profile) return
    const next = { ...reposted, [id]: true as const }
    setReposted(next); setLS('chismografo_reposted', next)
    setChismes(prev => prev.map(c => c.id === id ? { ...c, repost_count: c.repost_count + 1 } : c))
    await darRepost(id, profile.username, profile.avatarSeed, texto)
    toast.success('se lo pasaste a todos.')
  }

  if (!profile) return null

  return (
    <div className="h-full overflow-y-auto ruled bg-paper text-ink">
      <div className="max-w-[600px] mx-auto">

        {/* Título de sección */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 py-5 border-b border-line flex items-center gap-2.5 bg-paper"
        >
          <FireFlame width={26} height={26} style={{ color: 'var(--highlight)' }} />
          <span className="font-hand-title text-[36px] leading-none text-ink">
            lo más chismeado
          </span>
        </motion.div>

        {/* ── Skeleton ── */}
        {loading ? (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-5 border-b border-line flex gap-4">
                <span className="font-mono text-[40px] font-bold text-ink-ghost w-12 shrink-0 leading-none tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 flex flex-col gap-2.5 pt-1">
                  <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.05 }} className="h-2 bg-ink w-24" />
                  <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2 bg-ink w-full" />
                  <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.15 }} className="h-2 bg-ink w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : chismes.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <p className="font-hand text-[20px] text-ink-faint">aún nadie ha chismeado.</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <AnimatePresence>
              {chismes.map((c, rank) => {
                const isLiked = !!liked[c.id]
                const isReposted = !!reposted[c.id]
                const totalScore = c.like_count + c.comment_count + c.repost_count
                const top3 = rank < 3

                return (
                  <motion.div key={c.id} variants={staggerItem} className="border-b border-line">
                    <ViewTransition name={`post-${c.id}`}>
                      <article className="px-4 py-5 flex gap-4">

                        {/* Número circulado a mano */}
                        <div className="shrink-0 w-12 flex flex-col items-center pt-0.5">
                          <span
                            className="font-mono text-[30px] font-bold leading-none tabular-nums flex items-center justify-center"
                            style={top3
                              ? { color: rank === 0 ? 'var(--highlight-ink)' : 'var(--ink)', background: rank === 0 ? 'var(--highlight)' : 'transparent', border: `2px solid ${rank === 0 ? 'var(--highlight)' : 'var(--margin)'}`, borderRadius: '50%', width: 44, height: 44, transform: 'rotate(-6deg)' }
                              : { color: 'var(--ink-ghost)' }
                            }
                          >
                            {rank + 1}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <ViewTransition name={`avatar-${c.id}`}>
                              <Avatar seed={c.avatar_seed} size={26} frame="tape" className="shrink-0" />
                            </ViewTransition>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{c.username}</span>
                            <span className="text-[11px] text-ink-faint font-mono">· {timeAgo(c.created_at)}</span>
                          </div>

                          {c.secreto ? (
                            <div className="mb-3">
                              <SecretText text={c.texto} className="font-hand text-ink leading-[1.4] whitespace-pre-wrap break-words" />
                            </div>
                          ) : (
                            <p
                              className="font-hand leading-[1.4] whitespace-pre-wrap break-words mb-3 cursor-pointer text-ink"
                              style={{ fontSize: rank === 0 ? '22px' : top3 ? '20px' : '18px' }}
                              onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                            >
                              {c.texto}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <motion.button onClick={() => handleLike(c.id)} whileTap={!isLiked ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                  {isLiked ? <HeartSolid width={14} height={14} style={{ color: 'var(--highlight)' }} /> : <Heart width={14} height={14} color="var(--ink-soft)" />}
                                </motion.div>
                                <CounterFlip count={c.like_count} active={isLiked} large />
                              </motion.button>

                              <motion.button onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))} whileTap={{ scale: 0.85 }} className="flex items-center gap-2">
                                <MessageText width={14} height={14} color="var(--ink-soft)" />
                                <CounterFlip count={c.comment_count} active={false} large />
                              </motion.button>

                              <motion.button onClick={() => setRepostTarget(c)} whileTap={!isReposted ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={{ rotate: isReposted ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                  <Refresh width={14} height={14} color={isReposted ? 'var(--highlight)' : 'var(--ink-soft)'} />
                                </motion.div>
                                <CounterFlip count={c.repost_count} active={isReposted} large />
                              </motion.button>

                              <BookmarkButton chisme={c} size={14} />
                            </div>

                            {totalScore > 0 && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                                {totalScore} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </ViewTransition>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <RepostModal
        chisme={repostTarget}
        profile={profile}
        isReposted={repostTarget ? !!reposted[repostTarget.id] : false}
        onClose={() => setRepostTarget(null)}
        onConfirm={async (id) => { await handleRepostConfirm(id); setRepostTarget(null) }}
      />
    </div>
  )
}

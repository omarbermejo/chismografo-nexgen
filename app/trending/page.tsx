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
import { staggerContainer, staggerItem } from '@/lib/variants'

const BRAND = '#39e079'

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
    <div className="h-full overflow-y-auto bg-black text-[#f0f0f0]">
      <div className="max-w-[600px] mx-auto">

        {/* Título de sección */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 py-4 border-b border-[#181818] flex items-center gap-2.5"
        >
          <FireFlame width={28} height={28} style={{ color: BRAND }} />
          <span className="text-[42px] font-black uppercase tracking-tighter leading-none text-white">
            Trending
          </span>
        </motion.div>

        {/* ── Skeleton ── */}
        {loading ? (
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-5 border-b border-[#181818] flex gap-4">
                <motion.div
                  animate={{ opacity: [0.04, 0.1, 0.04] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }}
                  className="text-[44px] font-black text-[#0d0d0d] w-12 shrink-0 leading-none tabular-nums"
                >
                  {String(i + 1).padStart(2, '0')}
                </motion.div>
                <div className="flex-1 flex flex-col gap-2.5 pt-1">
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.05 }} className="h-2 bg-white w-24" />
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2 bg-white w-full" />
                  <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.15 }} className="h-2 bg-white w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : chismes.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
              Aún no hay chismes.
            </p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <AnimatePresence>
              {chismes.map((c, rank) => {
                const isLiked = !!liked[c.id]
                const isReposted = !!reposted[c.id]
                const totalScore = c.like_count + c.comment_count + c.repost_count

                return (
                  <motion.div
                    key={c.id}
                    variants={staggerItem}
                    className="border-b border-[#181818]"
                  >
                    <ViewTransition name={`post-${c.id}`}>
                      <article className="px-4 py-5 flex gap-4">

                        {/* Ranking number */}
                        <div className="shrink-0 w-10 flex flex-col items-start pt-0.5">
                          <span
                            className="text-[36px] font-black leading-none tabular-nums"
                            style={{ color: rank === 0 ? BRAND : rank === 1 ? '#303030' : rank === 2 ? '#252525' : '#1a1a1a' }}
                          >
                            {String(rank + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">

                          {/* Usuario + avatar + tiempo */}
                          <div className="flex items-center gap-2 mb-2">
                            <ViewTransition name={`avatar-${c.id}`}>
                              <Avatar seed={c.avatar_seed} size={24} className="overflow-hidden shrink-0" style={{ borderRadius: 0 }} />
                            </ViewTransition>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
                            <span className="text-[11px] text-[#303030]">· {timeAgo(c.created_at)}</span>
                          </div>

                          {/* Texto */}
                          <p
                            className="leading-[1.65] whitespace-pre-wrap break-words mb-3 cursor-pointer"
                            style={{ fontSize: rank === 0 ? '18px' : rank < 3 ? '16px' : '15px', color: '#d8d8d8' }}
                            onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                          >
                            {c.texto}
                          </p>

                          {/* Score + acciones */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">

                              <motion.button
                                onClick={() => handleLike(c.id)}
                                whileTap={!isLiked ? { scale: 0.85 } : undefined}
                                className="flex items-center gap-2"
                              >
                                <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                  {isLiked
                                    ? <HeartSolid width={14} height={14} style={{ color: BRAND }} />
                                    : <Heart width={14} height={14} color="#404040" />
                                  }
                                </motion.div>
                                <CounterFlip count={c.like_count} active={isLiked} large />
                              </motion.button>

                              <motion.button
                                onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                                whileTap={{ scale: 0.85 }}
                                className="flex items-center gap-2"
                              >
                                <MessageText width={14} height={14} color="#404040" />
                                <CounterFlip count={c.comment_count} active={false} large />
                              </motion.button>

                              <motion.button
                                onClick={() => handleRepost(c.id)}
                                whileTap={!isReposted ? { scale: 0.85 } : undefined}
                                className="flex items-center gap-2"
                              >
                                <motion.div animate={{ rotate: isReposted ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                  <Refresh width={14} height={14} color={isReposted ? BRAND : '#404040'} />
                                </motion.div>
                                <CounterFlip count={c.repost_count} active={isReposted} large />
                              </motion.button>

                            </div>

                            {/* Score total */}
                            {totalScore > 0 && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222]">
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
    </div>
  )
}

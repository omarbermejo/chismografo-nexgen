'use client'

import { useEffect, useState, startTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { Heart, HeartSolid, MessageText, Refresh, ArrowLeft } from 'iconoir-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getProfile, type Profile } from '@/lib/profile'
import { getChismesByHashtag, darLike, darRepost, type Chisme } from '@/lib/api'
import Avatar from '@/components/Avatar'
import CounterFlip from '@/components/CounterFlip'
import SecretText from '@/components/SecretText'
import BookmarkButton from '@/components/BookmarkButton'
import HashtagText from '@/components/HashtagText'
import PaperNote from '@/components/PaperNote'
import RepostModal from '@/components/RepostModal'
import { staggerContainer, staggerItem } from '@/lib/variants'

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

export default function HashtagPage() {
  const router = useRouter()
  const params = useParams()
  const tag = params.tag as string

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
    getChismesByHashtag(tag)
      .then(setChismes)
      .finally(() => setLoading(false))
  }, [tag, router])

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
    <div className="h-full flex flex-col overflow-hidden bg-paper text-ink">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 z-20 bg-paper border-b border-line h-[56px]"
      >
        <div className="h-full max-w-[600px] mx-auto px-3 flex items-center gap-4">
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.9 }}
            className="p-2 -ml-2 hover:bg-[var(--state-hover)] transition-colors"
          >
            <ArrowLeft width={18} height={18} color="var(--ink)" />
          </motion.button>
          <span
            className="font-hand-title text-[28px] leading-none"
            style={{ color: 'var(--highlight)' }}
          >
            #{tag}
          </span>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto ruled">
        <div className="max-w-[600px] mx-auto">

          {loading ? (
            <div className="flex flex-col gap-4 px-3 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="note px-4 py-4 flex gap-3">
                  <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="w-9 h-9 bg-ink shrink-0" />
                  <div className="flex-1 flex flex-col gap-3 pt-1">
                    <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2.5 bg-ink w-full" />
                    <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.15 }} className="h-2.5 bg-ink w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : chismes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center py-24"
            >
              <p className="font-hand text-[20px] text-ink-faint">
                nadie ha chismeado sobre #{tag} todavía.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4 px-3 py-4">
              <AnimatePresence initial={false}>
                {chismes.map((c) => (
                  <motion.div
                    key={c.id}
                    variants={staggerItem}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                  >
                    <ViewTransition name={`post-${c.id}`}>
                      <PaperNote seed={c.id} tape>
                        <article className="px-4 py-4 flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            <Avatar seed={c.avatar_seed} size={38} frame="tape" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <button
                                onClick={() => startTransition(() => router.push(`/u/${c.username}`))}
                                className="text-[11px] font-bold uppercase tracking-widest text-ink-soft hover:text-ink transition-colors"
                              >
                                {c.username}
                              </button>
                              <span className="text-[11px] text-ink-faint font-mono">{timeAgo(c.created_at)}</span>
                            </div>
                            {c.secreto ? (
                              <SecretText text={c.texto} className="font-hand text-[20px] text-ink leading-[1.45] whitespace-pre-wrap break-words" />
                            ) : (
                              <HashtagText
                                text={c.texto}
                                className="font-hand text-[20px] text-ink leading-[1.45] whitespace-pre-wrap break-words cursor-pointer"
                                onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))}
                              />
                            )}
                            <div className="flex items-center gap-5 mt-3">
                              <motion.button onClick={() => handleLike(c.id)} whileTap={!liked[c.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={liked[c.id] ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
                                  {liked[c.id]
                                    ? <HeartSolid width={15} height={15} style={{ color: 'var(--highlight)' }} />
                                    : <Heart width={15} height={15} color="var(--ink-soft)" />
                                  }
                                </motion.div>
                                <CounterFlip count={c.like_count} active={!!liked[c.id]} large />
                              </motion.button>
                              <motion.button onClick={() => startTransition(() => router.push(`/chisme/${c.id}`))} whileTap={{ scale: 0.85 }} className="flex items-center gap-2">
                                <MessageText width={15} height={15} color="var(--ink-soft)" />
                                <CounterFlip count={c.comment_count} active={false} large />
                              </motion.button>
                              <motion.button onClick={() => setRepostTarget(c)} whileTap={!reposted[c.id] ? { scale: 0.85 } : undefined} className="flex items-center gap-2">
                                <motion.div animate={{ rotate: reposted[c.id] ? 360 : 0 }} transition={{ duration: 0.4 }}>
                                  <Refresh width={15} height={15} color={reposted[c.id] ? 'var(--highlight)' : 'var(--ink-soft)'} />
                                </motion.div>
                                <CounterFlip count={c.repost_count} active={!!reposted[c.id]} large />
                              </motion.button>
                              <BookmarkButton chisme={c} />
                            </div>
                          </div>
                        </article>
                      </PaperNote>
                    </ViewTransition>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

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

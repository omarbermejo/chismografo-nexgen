'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getComentarios, postComentario, type Comentario } from '@/lib/api'
import { type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'
import { staggerContainer, staggerItem } from '@/lib/variants'

interface Props {
  chismeId: string
  profile: Profile
  onCommentAdded: () => void
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

export default function CommentSection({ chismeId, profile, onCommentAdded }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getComentarios(chismeId)
      .then(setComentarios)
      .finally(() => {
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 80)
      })
  }, [chismeId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    try {
      const nuevo = await postComentario(chismeId, texto.trim(), profile.username, profile.avatarSeed)
      setComentarios(prev => [...prev, nuevo])
      setTexto('')
      onCommentAdded()
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="pb-1">
      {/* Lista de comentarios */}
      {loading ? (
        <div className="px-4 py-3 pl-[52px]">
          <motion.span
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.3 }}
            className="text-[12px] text-ink-soft"
          >
            Cargando…
          </motion.span>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <AnimatePresence initial={false}>
            {comentarios.map(c => (
              <motion.div
                key={c.id}
                variants={staggerItem}
                initial="hidden"
                animate="show"
                className="px-4 py-2.5 flex gap-3 border-b border-line last:border-0"
              >
                {/* Avatar pequeño */}
                <div className="shrink-0 mt-0.5">
                  <Avatar seed={c.avatar_seed} size={30} frame="tape" />
                </div>

                {/* Contenido */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold uppercase tracking-wide text-ink-soft leading-none">{c.username}</span>
                    <span className="text-ink-faint text-[11px] font-mono">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="font-hand text-[18px] text-ink leading-[1.4] whitespace-pre-wrap break-words mt-0.5">
                    {c.texto}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comentarios.length === 0 && (
            <p className="px-4 py-2.5 pl-[52px] text-[13px] text-ink-faint font-hand">
              Nadie ha respondido todavía. Sé el primero.
            </p>
          )}
        </motion.div>
      )}

      {/* Compose comentario */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 flex items-center gap-3 border-t border-line"
      >
        <Avatar seed={profile.avatarSeed} size={30} frame="tape" className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (texto.trim() && !sending) handleSubmit(e as unknown as React.FormEvent)
            }
          }}
          placeholder="responde en el cuaderno…"
          maxLength={300}
          className="flex-1 bg-transparent font-hand text-[18px] text-ink placeholder-ink-faint outline-none"
        />
        <motion.button
          type="submit"
          disabled={!texto.trim() || sending}
          whileTap={{ scale: 0.9 }}
          className="text-[12px] font-bold uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
          style={{ color: 'var(--highlight)' }}
        >
          {sending ? '…' : 'mándalo'}
        </motion.button>
      </form>
    </div>
  )
}

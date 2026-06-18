'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, ShareIos } from 'iconoir-react'
import { toast } from 'sonner'
import { type Cuestionario } from '@/lib/api'
import Avatar from '@/components/Avatar'

interface Props {
  cuestionario: Cuestionario
  onParticipate: (id: string) => void
  alreadyAnswered: boolean
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
    .replace('alrededor de ', '').replace('menos de ', '')
    .replace(' minutos', 'm').replace(' minuto', 'm')
    .replace(' horas', 'h').replace(' hora', 'h')
    .replace(' días', 'd').replace(' día', 'd')
}

export default function CuestionarioCard({ cuestionario: c, onParticipate, alreadyAnswered }: Props) {
  return (
    <article
      onClick={() => onParticipate(c.id)}
      className="px-4 py-4 flex gap-3 cursor-pointer"
    >
      {/* Avatar — sello del autor */}
      <div className="shrink-0 mt-0.5">
        <Avatar seed={c.avatar_seed} size={38} frame="stamp" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">{c.username}</span>
          <span className="text-[11px] text-ink-faint font-mono">{timeAgo(c.created_at)}</span>
        </div>

        {/* Sello "el cuaderno que circula" */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 inline-block"
            style={{ background: 'var(--highlight)', color: 'var(--highlight-ink)', transform: 'rotate(-1.5deg)' }}
          >
            el cuaderno que circula
          </span>
        </div>

        {/* Título manuscrito */}
        <p className="font-hand-title text-[24px] text-ink leading-[1.1] mb-3">
          {c.titulo}
        </p>

        {/* Meta + acción */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-[11px] uppercase tracking-wide text-ink-faint">
              {c.pregunta_count} {c.pregunta_count === 1 ? 'pregunta' : 'preguntas'}
            </span>
            {c.participant_count > 0 && (
              <>
                <span className="text-ink-ghost">·</span>
                <span className="text-[11px] uppercase tracking-wide text-ink-faint">
                  {c.participant_count} {c.participant_count === 1 ? 'firma' : 'firmas'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                const url = `${window.location.origin}/cuestionario/${c.id}`
                navigator.clipboard.writeText(url)
                toast.success('listo, pásalo por debajo del pupitre.')
              }}
              whileTap={{ scale: 0.88 }}
              className="p-1.5 hover:bg-[var(--state-hover)] transition-colors"
              style={{ color: 'var(--ink-soft)' }}
            >
              <ShareIos width={14} height={14} />
            </motion.button>

            <motion.button
              onClick={(e) => { e.stopPropagation(); onParticipate(c.id) }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-all"
              style={alreadyAnswered
                ? { color: 'var(--ink-soft)', borderColor: 'var(--border)', background: 'transparent' }
                : { color: 'var(--highlight-ink)', background: 'var(--highlight)', borderColor: 'var(--highlight)' }
              }
            >
              {alreadyAnswered ? 'ver' : 'firma aquí'}
              <ArrowRight width={12} height={12} />
            </motion.button>
          </div>
        </div>
      </div>
    </article>
  )
}

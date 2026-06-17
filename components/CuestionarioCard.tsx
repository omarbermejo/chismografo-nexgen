'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight } from 'iconoir-react'
import { type Cuestionario } from '@/lib/api'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'

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
    <article className="px-4 py-4 flex gap-3 border-b border-[#181818]">

      {/* Avatar + left column */}
      <div className="shrink-0 mt-0.5">
        <Avatar seed={c.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
          <span className="text-[11px] text-[#333]">{timeAgo(c.created_at)}</span>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5"
            style={{ background: BRAND, color: '#000' }}
          >
            Cuestionario
          </span>
        </div>

        {/* Title */}
        <p className="text-[18px] font-black text-white leading-tight tracking-tight mb-3">
          {c.titulo}
        </p>

        {/* Meta + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2e2e2e]">
              {c.pregunta_count} {c.pregunta_count === 1 ? 'pregunta' : 'preguntas'}
            </span>
            {c.participant_count > 0 && (
              <>
                <span className="text-[#1c1c1c]">·</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#2e2e2e]">
                  {c.participant_count} {c.participant_count === 1 ? 'resp' : 'resps'}
                </span>
              </>
            )}
          </div>

          <motion.button
            onClick={() => onParticipate(c.id)}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all"
            style={alreadyAnswered
              ? { color: '#404040', border: '1px solid #1c1c1c' }
              : { color: '#000', background: BRAND }
            }
          >
            {alreadyAnswered ? 'Ver' : 'Participar'}
            <ArrowRight width={12} height={12} />
          </motion.button>
        </div>
      </div>
    </article>
  )
}

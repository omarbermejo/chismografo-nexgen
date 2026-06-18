'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, ShareIos } from 'iconoir-react'
import { toast } from 'sonner'
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
    <article
      onClick={() => onParticipate(c.id)}
      className="border-b border-[#181818] px-4 py-4 flex gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
    >
      {/* Avatar col */}
      <div className="shrink-0 mt-0.5">
        <Avatar seed={c.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
          <span className="text-[11px] text-[#333]">{timeAgo(c.created_at)}</span>
        </div>

        {/* Badge */}
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

          <div className="flex items-center gap-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                const url = `${window.location.origin}/cuestionario/${c.id}`
                navigator.clipboard.writeText(url)
                toast.success('Link copiado.')
              }}
              whileTap={{ scale: 0.88 }}
              className="p-1.5 hover:bg-white/[0.05] transition-colors"
              style={{ color: '#383838' }}
            >
              <ShareIos width={14} height={14} />
            </motion.button>

            <motion.button
              onClick={(e) => { e.stopPropagation(); onParticipate(c.id) }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-all"
              style={alreadyAnswered
                ? { color: '#404040', borderColor: '#1c1c1c', background: 'transparent' }
                : { color: '#000', background: BRAND, borderColor: BRAND }
              }
            >
              {alreadyAnswered ? 'Ver' : 'Participar'}
              <ArrowRight width={12} height={12} />
            </motion.button>
          </div>
        </div>
      </div>
    </article>
  )
}

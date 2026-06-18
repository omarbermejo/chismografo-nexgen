'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
  isActive?: boolean
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
    .replace('alrededor de ', '').replace('menos de ', '')
    .replace(' minutos', 'm').replace(' minuto', 'm')
    .replace(' horas', 'h').replace(' hora', 'h')
    .replace(' días', 'd').replace(' día', 'd')
}

export default function CuestionarioCard({ cuestionario: c, onParticipate, alreadyAnswered, isActive = false }: Props) {
  return (
    <motion.article
      animate={{ backgroundColor: isActive ? 'rgba(57,224,121,0.035)' : 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.25 }}
      className="relative flex border-b overflow-hidden"
      style={{ borderBottomColor: '#181818' }}
    >
      {/* Left border — active indicator */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ originX: 0, background: BRAND }}
        className="absolute left-0 top-0 bottom-0 w-[3px]"
      />

      {/* Right connector arrow — visual thread toward panel */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, delay: 0.08 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-0 pointer-events-none"
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="flex items-center"
            >
              <div
                className="h-px w-10"
                style={{ background: `linear-gradient(to right, transparent, ${BRAND})` }}
              />
              <div style={{
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderLeft: `6px solid ${BRAND}`,
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 py-4 flex gap-3 pl-[19px]">
        {/* Avatar col */}
        <div className="shrink-0 mt-0.5 relative">
          <Avatar seed={c.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
          {/* Thread line downward when active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 0.25 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ originY: 0, background: BRAND }}
                className="absolute top-[36px] bottom-[-16px] w-px left-1/2 -translate-x-1/2"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 pr-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white">{c.username}</span>
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: BRAND }}
                  >
                    · abierto
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
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
              onClick={() => {
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
              onClick={() => onParticipate(c.id)}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-all"
              style={isActive
                ? { color: BRAND, borderColor: BRAND, background: 'transparent' }
                : alreadyAnswered
                ? { color: '#404040', borderColor: '#1c1c1c', background: 'transparent' }
                : { color: '#000', background: BRAND, borderColor: BRAND }
              }
            >
              {alreadyAnswered ? 'Ver' : 'Participar'}
              <motion.div
                animate={isActive ? { x: [0, 3, 0] } : { x: 0 }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 1.2 }}
              >
                <ArrowRight width={12} height={12} />
              </motion.div>
            </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

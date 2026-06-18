'use client'

import { motion } from 'framer-motion'
import type { Poll, PollOpcion } from '@/lib/api'

interface Props {
  poll: Poll
  chismeId: string
  yaVote: boolean
  onVotar: (opcionId: string) => void
}

export default function PollWidget({ poll, yaVote, onVotar }: Props) {
  const total = poll.opciones.reduce((sum, o) => sum + o.voto_count, 0)

  function pct(o: PollOpcion) {
    if (total === 0) return 0
    return Math.round((o.voto_count / total) * 100)
  }

  return (
    <div className="mt-3 border border-line rounded-sm overflow-hidden" style={{ background: 'var(--paper-sunken)' }}>
      <p className="px-3 pt-3 pb-2 text-[12px] font-black uppercase tracking-widest text-ink-soft border-b border-line">
        {poll.pregunta}
      </p>
      <div className="px-3 py-2 flex flex-col gap-2">
        {poll.opciones.map(opcion => (
          <div key={opcion.id}>
            {yaVote ? (
              // Resultado: barra de progreso
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-hand text-[16px] text-ink">{opcion.texto}</span>
                  <span className="text-[11px] font-mono text-ink-soft">{pct(opcion)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct(opcion) / 100 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    style={{ originX: 0, height: '100%', background: 'var(--highlight)' }}
                  />
                </div>
              </div>
            ) : (
              // Sin votar: botón
              <motion.button
                onClick={(e) => { e.stopPropagation(); onVotar(opcion.id) }}
                whileTap={{ scale: 0.97 }}
                className="w-full text-left px-3 py-2 border border-line font-hand text-[16px] text-ink transition-colors hover:bg-[var(--state-hover)]"
              >
                {opcion.texto}
              </motion.button>
            )}
          </div>
        ))}
      </div>
      {yaVote && total > 0 && (
        <p className="px-3 pb-2 text-[10px] font-mono text-ink-faint">
          {total} {total === 1 ? 'voto' : 'votos'}
        </p>
      )}
    </div>
  )
}

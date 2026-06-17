'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Xmark, ArrowLeft } from 'iconoir-react'
import { toast } from 'sonner'
import { getCuestionario, responderCuestionario, type CuestionarioDetalle } from '@/lib/api'
import { type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

interface Props {
  cuestionarioId: string
  profile: Profile
  onClose: () => void
}

export default function AnswerPanel({ cuestionarioId, profile, onClose }: Props) {
  const [data, setData] = useState<CuestionarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [view, setView] = useState<'answer' | 'results'>('answer')
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    const answeredIds: string[] = getLS('chismografo_answered', [])
    if (answeredIds.includes(cuestionarioId)) {
      setAnswered(true)
      setView('results')
    }
    getCuestionario(cuestionarioId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [cuestionarioId])

  async function handleSubmit() {
    if (!data) return
    const missing = data.preguntas.some(p => !respuestas[p.id]?.trim())
    if (missing) { toast.error('Responde todas las preguntas.'); return }
    setSending(true)
    try {
      const payload = data.preguntas.map(p => ({ pregunta_id: p.id, texto: respuestas[p.id].trim() }))
      await responderCuestionario(cuestionarioId, payload, profile.username, profile.avatarSeed)
      const next: string[] = [...getLS<string[]>('chismografo_answered', []), cuestionarioId]
      setLS('chismografo_answered', next)
      setAnswered(true)
      // reload for results
      const updated = await getCuestionario(cuestionarioId)
      setData(updated)
      setView('results')
      toast.success('¡Respondido!')
    } catch {
      toast.error('Error al enviar.')
    } finally {
      setSending(false)
    }
  }

  const allFilled = data?.preguntas.every(p => respuestas[p.id]?.trim())

  return (
    <div className="flex flex-col h-full bg-black">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#181818] shrink-0">
        {view === 'results' && answered ? (
          <button
            onClick={() => setView('answer')}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#404040] hover:text-white transition-colors"
          >
            <ArrowLeft width={14} height={14} />
            Responder
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/[0.06] transition-colors ml-auto"
        >
          <Xmark width={18} height={18} color="#808080" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 px-5 pt-6 flex flex-col gap-4">
          <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8 }} className="h-6 bg-white w-3/4" />
          <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }} className="h-2 bg-white w-1/3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="pt-4 border-t border-[#181818] flex flex-col gap-2">
              <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-2.5 bg-white w-2/3" />
              <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.2 }} className="h-8 bg-white w-full" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto">

          {/* Title block */}
          <div className="px-5 pt-5 pb-4 border-b border-[#181818]">
            <div className="flex items-center gap-2 mb-3">
              <Avatar seed={data.avatar_seed} size={22} className="overflow-hidden shrink-0" style={{ borderRadius: 0 }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#404040]">{data.username}</span>
            </div>
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight mb-2">
              {data.titulo}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#282828]">
                {data.pregunta_count} preguntas
              </span>
              {data.participant_count > 0 && (
                <>
                  <span className="text-[#282828]">·</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#282828]">
                    {data.participant_count} {data.participant_count === 1 ? 'participante' : 'participantes'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Toggle view if already answered */}
          {answered && (
            <div className="flex border-b border-[#181818]">
              <button
                onClick={() => setView('answer')}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${view === 'answer' ? 'text-white border-b-2 border-white' : 'text-[#333]'}`}
              >
                Mis respuestas
              </button>
              <button
                onClick={() => setView('results')}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${view === 'results' ? 'text-white border-b-2 border-white' : 'text-[#333]'}`}
              >
                Resultados
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {view === 'answer' ? (
              <motion.div
                key="answer"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="px-5 pb-32"
              >
                {data.preguntas.map((p, i) => (
                  <div key={p.id} className="pt-5 pb-4 border-b border-[#181818] last:border-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#383838] mb-1.5">
                      {i + 1} / {data.preguntas.length}
                    </p>
                    <p className="text-[15px] font-semibold text-[#e0e0e0] leading-snug mb-3">
                      {p.texto}
                    </p>
                    {answered ? (
                      <p className="text-[14px] text-[#606060] leading-snug">
                        {respuestas[p.id] || <span className="text-[#282828] italic">Sin respuesta</span>}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={respuestas[p.id] ?? ''}
                        onChange={e => setRespuestas(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Tu respuesta…"
                        maxLength={200}
                        className="w-full bg-transparent border-b border-[#1c1c1c] focus:border-white text-[14px] text-white placeholder-[#282828] py-2 outline-none transition-colors"
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="px-5 pb-32"
              >
                {data.preguntas.map((p) => (
                  <div key={p.id} className="pt-5 pb-4 border-b border-[#181818] last:border-0">
                    <p className="text-[13px] font-semibold text-[#555] leading-snug mb-3">
                      {p.texto}
                    </p>
                    {p.respuestas.length === 0 ? (
                      <p className="text-[12px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                        Sin respuestas aún.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {p.respuestas.map(r => (
                          <div key={r.id} className="flex items-start gap-2.5">
                            <Avatar seed={r.avatar_seed} size={20} className="overflow-hidden shrink-0 mt-0.5" style={{ borderRadius: 0 }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#383838] mr-2">{r.username}</span>
                              <span className="text-[13px] text-[#b0b0b0]">{r.texto}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Submit button */}
      <AnimatePresence>
        {!answered && view === 'answer' && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 inset-x-0 p-4 bg-black border-t border-[#181818]"
          >
            <button
              onClick={handleSubmit}
              disabled={!allFilled || sending}
              className="w-full py-3.5 text-[12px] font-black uppercase tracking-widest text-black disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              style={{ background: allFilled ? BRAND : '#1a1a1a', color: allFilled ? '#000' : '#333' }}
            >
              {sending ? 'Enviando…' : 'Responder →'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

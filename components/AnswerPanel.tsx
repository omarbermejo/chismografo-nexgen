'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Xmark } from 'iconoir-react'
import { toast } from 'sonner'
import { getCuestionario, responderCuestionario, type CuestionarioDetalle } from '@/lib/api'
import { type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'
const HEADER_H = 56

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

      {/* ── Header — same height as feed header ── */}
      <div
        style={{ height: HEADER_H }}
        className="shrink-0 border-b border-[#1e1e1e] flex items-center px-4 gap-3"
      >
        {/* Avatar + title */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5 overflow-hidden">
          {loading || !data ? (
            <motion.div
              animate={{ opacity: [0.04, 0.12, 0.04] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="h-3 w-36 bg-white"
            />
          ) : (
            <>
              <Avatar seed={data.avatar_seed} size={22} className="overflow-hidden shrink-0" style={{ borderRadius: 0 }} />
              <span
                className="text-[13px] font-black text-white tracking-tight truncate"
              >
                {data.titulo}
              </span>
            </>
          )}
        </div>

        {/* View toggle tabs */}
        {answered && data && (
          <div className="flex items-center gap-0 border border-[#1c1c1c] shrink-0">
            <button
              onClick={() => setView('answer')}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors"
              style={view === 'answer'
                ? { background: '#fff', color: '#000' }
                : { color: '#383838' }
              }
            >
              Mis resp.
            </button>
            <button
              onClick={() => setView('results')}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors"
              style={view === 'results'
                ? { background: BRAND, color: '#000' }
                : { color: '#383838' }
              }
            >
              Resultados
            </button>
          </div>
        )}

        {/* Close */}
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.88 }}
          className="p-1.5 shrink-0 hover:bg-white/[0.06] transition-colors"
        >
          <Xmark width={16} height={16} color="#505050" />
        </motion.button>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex-1 px-5 pt-6 flex flex-col gap-5">
          <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8 }} className="h-3 bg-white w-1/3" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="pt-5 border-t border-[#181818] flex flex-col gap-2.5">
              <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="h-2.5 bg-white w-2/3" />
              <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 + 0.1 }} className="h-8 bg-white w-full" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Meta strip */}
          <div className="px-5 py-3 border-b border-[#111] flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#282828]">
              {data.pregunta_count} {data.pregunta_count === 1 ? 'pregunta' : 'preguntas'}
            </span>
            {data.participant_count > 0 && (
              <>
                <span className="text-[#1c1c1c]">·</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#282828]">
                  {data.participant_count} {data.participant_count === 1 ? 'participante' : 'participantes'}
                </span>
              </>
            )}
          </div>

          {/* Scrollable questions */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {view === 'answer' ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="px-5 pb-28"
                >
                  {data.preguntas.map((p, i) => (
                    <div key={p.id} className="pt-5 pb-4 border-b border-[#181818] last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[28px] font-black leading-none tabular-nums text-[#1c1c1c]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#282828]">
                          / {data.preguntas.length}
                        </span>
                      </div>
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
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (allFilled && !sending) handleSubmit()
                            }
                          }}
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="px-5 pb-10"
                >
                  {data.preguntas.map((p, i) => (
                    <div key={p.id} className="pt-5 pb-4 border-b border-[#181818] last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[24px] font-black leading-none tabular-nums text-[#222]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-[#505050] leading-snug mb-3">
                        {p.texto}
                      </p>
                      {p.respuestas.length === 0 ? (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                          Sin respuestas aún
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {p.respuestas.map(r => (
                            <div key={r.id} className="flex items-start gap-2.5">
                              <Avatar seed={r.avatar_seed} size={20} className="overflow-hidden shrink-0 mt-0.5" style={{ borderRadius: 0 }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#383838] mb-0.5">{r.username}</div>
                                <div className="text-[13px] text-[#b0b0b0] leading-snug">{r.texto}</div>
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

          {/* Submit bar */}
          <AnimatePresence>
            {!answered && view === 'answer' && (
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 p-4 border-t border-[#181818] bg-black"
              >
                <motion.button
                  onClick={handleSubmit}
                  disabled={!allFilled || sending}
                  whileTap={allFilled ? { scale: 0.97 } : undefined}
                  className="w-full py-3.5 text-[12px] font-black uppercase tracking-widest disabled:cursor-not-allowed transition-all"
                  style={{
                    background: allFilled ? BRAND : '#0d0d0d',
                    color: allFilled ? '#000' : '#1e1e1e',
                    border: allFilled ? 'none' : '1px solid #181818',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={sending ? 'sending' : allFilled ? 'ready' : 'empty'}
                      initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.12 }}
                      className="block"
                    >
                      {sending ? 'Enviando…' : allFilled ? 'Responder →' : 'Completa todas las respuestas'}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  )
}

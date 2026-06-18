'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShareIos } from 'iconoir-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import TextareaAutosize from 'react-textarea-autosize'
import { getProfile, type Profile } from '@/lib/profile'
import { getCuestionario, responderCuestionario, type CuestionarioDetalle } from '@/lib/api'
import Avatar from '@/components/Avatar'
import { staggerContainer, staggerItem } from '@/lib/variants'
import { fireConfetti } from '@/lib/confetti'

const BRAND = '#39e079'
const HEADER_H = 56
const COMPOSE_H = 72

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

export default function CuestionarioThreadPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<CuestionarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    const answeredIds: string[] = getLS('chismografo_answered', [])
    if (answeredIds.includes(id)) setAnswered(true)
    getCuestionario(id)
      .then(setData)
      .catch(() => toast.error('No se encontró el cuestionario.'))
      .finally(() => setLoading(false))
  }, [id, router])

  const allFilled = data?.preguntas.every(p => respuestas[p.id]?.trim())

  async function handleSubmit() {
    if (!data || !profile) return
    if (!allFilled) { toast.error('Responde todas las preguntas.'); return }
    setSending(true)
    try {
      const payload = data.preguntas.map(p => ({ pregunta_id: p.id, texto: respuestas[p.id].trim() }))
      await responderCuestionario(id, payload, profile.username, profile.avatarSeed)
      const next: string[] = [...getLS<string[]>('chismografo_answered', []), id]
      setLS('chismografo_answered', next)
      setAnswered(true)
      const updated = await getCuestionario(id)
      setData(updated)
      fireConfetti()
      toast.success('¡Respondido!')
    } catch {
      toast.error('No se pudo enviar.')
    } finally {
      setSending(false)
    }
  }

  if (!profile) return null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-[#f0f0f0]">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ height: HEADER_H }}
        className="shrink-0 z-20 bg-black border-b border-[#181818]"
      >
        <div className="h-full max-w-[600px] mx-auto px-3 flex items-center gap-4">
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.9 }}
            className="p-2 -ml-2 hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft width={18} height={18} color="#f0f0f0" />
          </motion.button>
          <span className="text-[14px] font-black uppercase tracking-widest text-white flex-1">Hilo</span>
          <motion.button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Link copiado.')
            }}
            whileTap={{ scale: 0.88 }}
            className="p-2 hover:bg-white/[0.05] transition-colors"
            style={{ color: BRAND }}
          >
            <ShareIos width={17} height={17} />
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[600px] mx-auto" style={{ paddingBottom: answered ? 24 : COMPOSE_H + 8 }}>

          {loading ? (
            <div className="px-4 pt-5 pb-4 border-b border-[#181818]">
              <div className="flex gap-3 mb-4">
                <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-11 h-11 bg-white shrink-0" style={{ borderRadius: 0 }} />
                <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }} className="h-2.5 bg-white w-24 mt-2" />
              </div>
              <motion.div animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.15 }} className="h-4 bg-white w-3/4" />
            </div>
          ) : !data ? (
            <p className="py-20 text-center text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
              Cuestionario no encontrado.
            </p>
          ) : (
            <>
              {/* ── Post raíz ── */}
              <article className="px-4 pt-5 pb-4 border-b border-[#181818]">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar seed={data.avatar_seed} size={44} className="overflow-hidden shrink-0" style={{ borderRadius: 0 }} />
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-widest text-white">{data.username}</p>
                    <p className="text-[11px] text-[#383838] mt-0.5">{timeAgo(data.created_at)}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 self-start mt-0.5" style={{ background: BRAND, color: '#000' }}>
                    Cuestionario
                  </span>
                </div>

                <h1 className="text-[22px] font-black text-white leading-tight tracking-tight mb-4">
                  {data.titulo}
                </h1>

                <div className="flex gap-5">
                  <span className="text-[13px] text-[#383838]">
                    <span className="text-white font-black">{data.preguntas.length}</span> {data.preguntas.length === 1 ? 'Pregunta' : 'Preguntas'}
                  </span>
                  <span className="text-[13px] text-[#383838]">
                    <span className="text-white font-black">{data.participant_count}</span> {data.participant_count === 1 ? 'Participante' : 'Participantes'}
                  </span>
                </div>
              </article>

              {/* ── Hilo: cada pregunta con su campo (si no respondiste) y las respuestas globales ── */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                {data.preguntas.map((p, i) => (
                  <motion.div key={p.id} variants={staggerItem} className="border-b border-[#181818]">
                    {/* Pregunta como sub-cabecera del hilo */}
                    <div className="px-4 pt-5 pb-3 flex items-center gap-2">
                      <span className="text-[18px] font-black leading-none tabular-nums text-[#222]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-[14px] font-bold text-[#c0c0c0] leading-snug">{p.texto}</p>
                    </div>

                    {/* Tu respuesta (solo si no has respondido) */}
                    {!answered && (
                      <div className="px-4 pb-4 flex gap-3">
                        <Avatar seed={profile.avatarSeed} size={28} className="overflow-hidden shrink-0 mt-0.5" style={{ borderRadius: 0 }} />
                        <TextareaAutosize
                          value={respuestas[p.id] ?? ''}
                          onChange={e => setRespuestas(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Tu respuesta…"
                          minRows={1}
                          maxLength={300}
                          className="flex-1 bg-transparent border-b border-[#1c1c1c] focus:border-white text-[14px] text-white placeholder-[#282828] py-2 outline-none transition-colors resize-none leading-[1.6]"
                        />
                      </div>
                    )}

                    {/* Respuestas globales (todos las ven) */}
                    {p.respuestas.length === 0 ? (
                      <p className="px-4 pb-5 pl-[26px] text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                        Sin respuestas aún
                      </p>
                    ) : (
                      <div className="pb-3">
                        {p.respuestas.map(r => (
                          <div key={r.id} className="relative px-4 py-3 flex gap-3">
                            {/* Hilo conector */}
                            <div className="absolute left-[31px] top-0 bottom-0 w-px bg-[#161616]" />
                            <div className="shrink-0 mt-0.5 relative z-10">
                              <Avatar seed={r.avatar_seed} size={28} className="overflow-hidden" style={{ borderRadius: 0 }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white">{r.username}</span>
                                <span className="text-[11px] text-[#303030]">{timeAgo(r.created_at)}</span>
                              </div>
                              <p className="text-[14px] text-[#b0b0b0] leading-[1.6] whitespace-pre-wrap break-words">{r.texto}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Barra de envío (solo si no ha respondido) ── */}
      <AnimatePresence>
        {!answered && !loading && data && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ height: COMPOSE_H }}
            className="shrink-0 z-20 border-t border-[#181818] bg-black flex items-center"
          >
            <div className="max-w-[600px] mx-auto w-full px-4">
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
                {sending ? 'Enviando…' : allFilled ? 'Responder →' : 'Completa todas las respuestas'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

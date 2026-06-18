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
import PaperNote from '@/components/PaperNote'
import { staggerContainer, staggerItem } from '@/lib/variants'
import { fireConfetti } from '@/lib/confetti'

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
      toast.success('firmaste el cuaderno.')
    } catch {
      toast.error('No se pudo enviar. Inténtalo otra vez.')
    } finally {
      setSending(false)
    }
  }

  if (!profile) return null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-paper text-ink">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ height: HEADER_H }}
        className="shrink-0 z-20 bg-paper border-b border-line"
      >
        <div className="h-full max-w-[600px] mx-auto px-3 flex items-center gap-4">
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.9 }}
            className="p-2 -ml-2 hover:bg-[var(--state-hover)] transition-colors"
          >
            <ArrowLeft width={18} height={18} color="var(--ink)" />
          </motion.button>
          <span className="text-[13px] font-black uppercase tracking-widest text-ink flex-1">el cuaderno que circula</span>
          <motion.button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('listo, pásalo por debajo del pupitre.')
            }}
            whileTap={{ scale: 0.88 }}
            className="p-2 hover:bg-[var(--state-hover)] transition-colors"
            style={{ color: 'var(--highlight)' }}
          >
            <ShareIos width={17} height={17} />
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto ruled">
        <div className="max-w-[600px] mx-auto px-3 pt-4" style={{ paddingBottom: answered ? 24 : COMPOSE_H + 16 }}>

          {loading ? (
            <div className="note px-4 pt-5 pb-4">
              <div className="flex gap-3 mb-4">
                <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-11 h-11 bg-ink shrink-0" />
                <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }} className="h-2.5 bg-ink w-24 mt-2" />
              </div>
              <motion.div animate={{ opacity: [0.06, 0.16, 0.06] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.15 }} className="h-4 bg-ink w-3/4" />
            </div>
          ) : !data ? (
            <p className="py-20 text-center font-hand text-[18px] text-ink-faint">
              este cuaderno no aparece.
            </p>
          ) : (
            <>
              {/* ── Hoja raíz ── */}
              <PaperNote seed={data.id} tape tilt={0} className="px-4 pt-5 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar seed={data.avatar_seed} size={44} frame="stamp" className="shrink-0" />
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-widest text-ink">{data.username}</p>
                    <p className="text-[11px] text-ink-faint font-mono mt-0.5">{timeAgo(data.created_at)}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 self-start mt-0.5" style={{ background: 'var(--highlight)', color: 'var(--highlight-ink)', transform: 'rotate(-1.5deg)' }}>
                    pásalo
                  </span>
                </div>

                <h1 className="font-hand-title text-[30px] text-ink leading-[1.1] mb-4">
                  {data.titulo}
                </h1>

                <div className="flex gap-5 font-mono">
                  <span className="text-[12px] text-ink-soft">
                    <span className="text-ink font-bold">{data.preguntas.length}</span> {data.preguntas.length === 1 ? 'pregunta' : 'preguntas'}
                  </span>
                  <span className="text-[12px] text-ink-soft">
                    <span className="text-ink font-bold">{data.participant_count}</span> {data.participant_count === 1 ? 'firma' : 'firmas'}
                  </span>
                </div>
              </PaperNote>

              {/* ── Preguntas + firmas ── */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-4">
                {data.preguntas.map((p, i) => (
                  <motion.div key={p.id} variants={staggerItem} className="border-b border-line pb-3 mb-3">
                    {/* Número impreso en el margen + pregunta */}
                    <div className="pt-2 pb-3 flex items-start gap-3">
                      <span className="font-mono text-[26px] font-bold leading-none tabular-nums text-ink-ghost shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="font-hand-title text-[19px] text-ink leading-snug pt-1">{p.texto}</p>
                    </div>

                    {/* Tu renglón (solo si no has firmado) */}
                    {!answered && (
                      <div className="pb-4 pl-[42px] flex gap-3">
                        <Avatar seed={profile.avatarSeed} size={28} frame="tape" className="shrink-0 mt-0.5" />
                        <TextareaAutosize
                          value={respuestas[p.id] ?? ''}
                          onChange={e => setRespuestas(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="escribe aquí…"
                          minRows={1}
                          maxLength={300}
                          className="flex-1 bg-transparent border-b border-dashed border-ink-faint focus:border-ink font-hand text-[18px] text-ink placeholder-ink-faint py-1 outline-none transition-colors resize-none leading-[1.5]"
                        />
                      </div>
                    )}

                    {/* Firmas de todos */}
                    {p.respuestas.length === 0 ? (
                      <p className="pl-[42px] pb-2 font-hand text-[15px] text-ink-faint">este renglón está vacío 👀</p>
                    ) : (
                      <div className="pl-[42px]">
                        {p.respuestas.map(r => (
                          <div key={r.id} className="relative py-2 flex gap-3">
                            <div className="shrink-0 mt-0.5">
                              <Avatar seed={r.avatar_seed} size={26} frame="tape" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{r.username}</span>
                                <span className="text-[10px] text-ink-faint font-mono">{timeAgo(r.created_at)}</span>
                              </div>
                              <p className="font-hand text-[17px] text-ink leading-[1.35] whitespace-pre-wrap break-words">{r.texto}</p>
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

      {/* ── Barra de envío (solo si no ha firmado) ── */}
      <AnimatePresence>
        {!answered && !loading && data && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ height: COMPOSE_H }}
            className="shrink-0 z-20 border-t border-line bg-paper flex items-center"
          >
            <div className="max-w-[600px] mx-auto w-full px-4">
              <motion.button
                onClick={handleSubmit}
                disabled={!allFilled || sending}
                whileTap={allFilled ? { scale: 0.97 } : undefined}
                className="w-full py-3.5 text-[12px] font-black uppercase tracking-widest disabled:cursor-not-allowed transition-all"
                style={{
                  background: allFilled ? 'var(--highlight)' : 'var(--state-disabled-bg)',
                  color: allFilled ? 'var(--highlight-ink)' : 'var(--state-disabled-ink)',
                  border: allFilled ? 'none' : '1px solid var(--border)',
                }}
              >
                {sending ? 'pasando…' : allFilled ? 'pásalo al siguiente →' : 'completa todo para firmar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

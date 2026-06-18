'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShareIos, CheckCircle } from 'iconoir-react'
import { toast } from 'sonner'
import TextareaAutosize from 'react-textarea-autosize'
import { getProfile } from '@/lib/profile'
import { getCuestionario, responderCuestionario, type CuestionarioDetalle } from '@/lib/api'
import Avatar from '@/components/Avatar'
import { staggerContainer, staggerItem } from '@/lib/variants'

const BRAND = '#39e079'

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

export default function CuestionarioPublicPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [cuestionario, setCuestionario] = useState<CuestionarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState<string[]>([])

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setAnswered(getLS('chismografo_answered', []))
    getCuestionario(id)
      .then(setCuestionario)
      .catch(() => toast.error('No se encontró el cuestionario.'))
      .finally(() => setLoading(false))
  }, [id, router])

  const alreadyAnswered = answered.includes(id)

  async function handleSubmit() {
    if (!cuestionario) return
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    const allAnswered = cuestionario.preguntas.every(pr => respuestas[pr.id]?.trim())
    if (!allAnswered) { toast.error('Responde todas las preguntas.'); return }
    setSending(true)
    try {
      await responderCuestionario(
        id,
        Object.entries(respuestas).map(([pregunta_id, texto]) => ({ pregunta_id, texto })),
        p.username,
        p.avatarSeed,
      )
      const next = [...answered, id]
      setAnswered(next)
      setLS('chismografo_answered', next)
      setDone(true)
    } catch {
      toast.error('No se pudo enviar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-[#f0f0f0]">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ height: 56 }}
        className="shrink-0 z-20 bg-black border-b border-[#181818] flex items-center justify-between px-4"
      >
        <motion.button onClick={() => router.back()} whileTap={{ scale: 0.9 }} className="p-2 -ml-2 hover:bg-white/[0.05]">
          <ArrowLeft width={18} height={18} />
        </motion.button>
        <span className="text-[13px] font-black uppercase tracking-widest">Cuestionario</span>
        <motion.button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            toast.success('Link copiado.')
          }}
          whileTap={{ scale: 0.88 }}
          className="p-2 hover:bg-white/[0.05]"
          style={{ color: BRAND }}
        >
          <ShareIos width={17} height={17} />
        </motion.button>
      </motion.header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[600px] mx-auto px-4 py-6">

          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <motion.div key={i} animate={{ opacity: [0.04, 0.1, 0.04] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="h-12 bg-white" />
              ))}
            </div>
          ) : !cuestionario ? (
            <p className="text-center text-[11px] uppercase tracking-widest text-[#282828] py-20">No encontrado.</p>
          ) : (
            <>
              {/* Cuestionario header */}
              <div className="mb-6 pb-6 border-b border-[#181818]">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar seed={cuestionario.avatar_seed} size={36} className="overflow-hidden" style={{ borderRadius: 0 }} />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">{cuestionario.username}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5" style={{ background: BRAND, color: '#000' }}>
                        Cuestionario
                      </span>
                      <span className="text-[11px] text-[#333]">{cuestionario.participant_count} resps</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-[24px] font-black text-white leading-tight">{cuestionario.titulo}</h1>
              </div>

              {/* Done state */}
              <AnimatePresence mode="wait">
                {done || alreadyAnswered ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 py-12"
                  >
                    <CheckCircle width={40} height={40} style={{ color: BRAND }} />
                    <p className="text-[13px] font-black uppercase tracking-widest text-white">Ya respondiste</p>
                    <p className="text-[12px] text-[#383838] uppercase tracking-widest">Gracias por participar</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
                    {cuestionario.preguntas.map((p, i) => (
                      <motion.div key={p.id} variants={staggerItem} className="flex flex-col gap-3">
                        <p className="text-[13px] font-black text-white">
                          <span style={{ color: BRAND }} className="mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                          {p.texto}
                        </p>
                        <TextareaAutosize
                          value={respuestas[p.id] ?? ''}
                          onChange={e => setRespuestas(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Tu respuesta…"
                          minRows={2}
                          maxLength={300}
                          className="w-full bg-transparent border border-[#1c1c1c] px-4 py-3 text-[14px] text-[#e0e0e0] placeholder-[#282828] outline-none resize-none leading-[1.6] focus:border-[#333] transition-colors"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Submit bar */}
      {!done && !alreadyAnswered && cuestionario && (
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="shrink-0 p-4 border-t border-[#181818] bg-black"
        >
          <motion.button
            onClick={handleSubmit}
            disabled={sending}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 text-[12px] font-black uppercase tracking-widest disabled:cursor-not-allowed"
            animate={{
              background: Object.keys(respuestas).length === cuestionario.preguntas.length ? BRAND : '#141414',
              color: Object.keys(respuestas).length === cuestionario.preguntas.length ? '#000' : '#282828',
            }}
            transition={{ duration: 0.18 }}
          >
            {sending ? 'Enviando…' : 'Enviar respuestas →'}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

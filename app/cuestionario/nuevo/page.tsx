'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { ArrowLeft, Plus, Xmark, Drag } from 'iconoir-react'
import { toast } from 'sonner'
import { getProfile, type Profile } from '@/lib/profile'
import { postCuestionario, type Cuestionario } from '@/lib/api'
import CuestionarioCard from '@/components/CuestionarioCard'
import PaperNote from '@/components/PaperNote'

const HEADER_H = 56

interface PreguntaItem {
  key: string
  texto: string
}

let _keyCounter = 0
function newKey() { return `q-${++_keyCounter}` }

export default function NuevoCuestionarioPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [titulo, setTitulo] = useState('')
  const [items, setItems] = useState<PreguntaItem[]>([
    { key: newKey(), texto: '' },
    { key: newKey(), texto: '' },
  ])
  const [sending, setSending] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    setTimeout(() => titleRef.current?.focus(), 100)
  }, [router])

  const preguntasValidas = items.filter(i => i.texto.trim())
  const canPublish = titulo.trim().length > 0 && preguntasValidas.length >= 1

  function addItem() {
    if (items.length >= 10) return
    setItems(prev => [...prev, { key: newKey(), texto: '' }])
  }

  function removeItem(key: string) {
    if (items.length <= 1) return
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function updateItem(key: string, texto: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, texto } : i))
  }

  async function handlePublish() {
    if (!canPublish || !profile || sending) return
    setSending(true)
    try {
      await postCuestionario(
        titulo.trim(),
        preguntasValidas.map(i => i.texto.trim()),
        profile.username,
        profile.avatarSeed,
      )
      toast.success('lo soltaste al cuaderno.')
      router.replace('/feed')
    } catch {
      toast.error('No se pudo. Inténtalo otra vez.')
      setSending(false)
    }
  }

  if (!profile) return null

  const preview: Cuestionario = {
    id: 'preview',
    titulo: titulo || 'tu pregunta aquí',
    username: profile.username,
    avatar_seed: profile.avatarSeed,
    created_at: new Date().toISOString(),
    pregunta_count: Math.max(preguntasValidas.length, items.length),
    participant_count: 0,
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-paper text-ink">

      {/* Header */}
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
          <span className="text-[13px] font-black uppercase tracking-widest text-ink">
            arma el cuaderno
          </span>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto ruled">
      <div className="max-w-[600px] mx-auto px-4 pb-4">

        {/* ── Tema ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="py-6 border-b border-line"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-soft">la pregunta de portada</span>
            <AnimatePresence>
              {titulo.length > 0 && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] tabular-nums text-ink-faint font-mono"
                >
                  {titulo.length}/100
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <textarea
            ref={titleRef}
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="¿qué quieres preguntarle a todos?"
            maxLength={100}
            rows={2}
            className="w-full bg-transparent font-hand-title text-[30px] text-ink placeholder-ink-faint resize-none outline-none leading-tight"
          />
        </motion.div>

        {/* ── Preguntas ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="py-5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-soft">preguntas</span>
            <div className="flex items-center gap-1 font-mono">
              <motion.span
                key={preguntasValidas.length}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-[12px] font-bold tabular-nums text-ink"
              >
                {preguntasValidas.length}
              </motion.span>
              <span className="text-[10px] font-bold text-ink-faint">/ 10</span>
            </div>
          </div>

          {/* Lista reordenable = hojas que arrastras */}
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-0">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <Reorder.Item
                  key={item.key}
                  value={item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 py-3.5 border-b border-line cursor-default"
                >
                  <span
                    className="font-mono text-[22px] font-bold leading-none tabular-nums w-10 shrink-0"
                    style={{ color: item.texto.trim() ? 'var(--ink-soft)' : 'var(--ink-ghost)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <input
                    type="text"
                    value={item.texto}
                    onChange={e => updateItem(item.key, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addItem() }
                    }}
                    placeholder={`escribe la pregunta ${i + 1}…`}
                    maxLength={150}
                    className="flex-1 bg-transparent font-hand text-[18px] text-ink placeholder-ink-faint outline-none"
                  />

                  <Drag width={14} height={14} color="var(--ink-faint)" className="shrink-0 cursor-grab active:cursor-grabbing" />

                  {items.length > 1 && (
                    <motion.button type="button" onClick={() => removeItem(item.key)} whileTap={{ scale: 0.8 }} className="p-1 shrink-0">
                      <Xmark width={14} height={14} color="var(--ink-soft)" />
                    </motion.button>
                  )}
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {/* Agregar */}
          <AnimatePresence>
            {items.length < 10 ? (
              <motion.button
                type="button"
                onClick={addItem}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-2 mt-5 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-ink"
                style={{ color: 'var(--ink-soft)' }}
              >
                <Plus width={14} height={14} />
                agregar pregunta
              </motion.button>
            ) : (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint"
              >
                máximo 10 preguntas
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Preview ── */}
        <AnimatePresence>
          {titulo.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              className="border-t border-line pt-5"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-ink-soft block mb-4">
                así se verá
              </span>
              <PaperNote seed="preview" tape>
                <CuestionarioCard
                  cuestionario={preview}
                  onParticipate={() => {}}
                  alreadyAnswered={false}
                />
              </PaperNote>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>

      {/* ── Publicar ── */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="shrink-0 bg-paper border-t border-line p-4"
      >
        <div className="max-w-[600px] mx-auto">
          <motion.button
            onClick={handlePublish}
            disabled={!canPublish || sending}
            whileTap={canPublish ? { scale: 0.97 } : undefined}
            className="w-full py-4 text-[13px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed"
            style={{
              background: canPublish ? 'var(--highlight)' : 'var(--state-disabled-bg)',
              color: canPublish ? 'var(--highlight-ink)' : 'var(--state-disabled-ink)',
              border: canPublish ? 'none' : '1px solid var(--border)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={sending ? 'sending' : canPublish ? 'ready' : 'empty'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                {sending
                  ? 'soltando…'
                  : canPublish
                  ? `suéltalo — ${preguntasValidas.length} ${preguntasValidas.length === 1 ? 'pregunta' : 'preguntas'}`
                  : 'ponle una pregunta de portada'
                }
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { saveProfile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

export default function SetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  const seed = username.trim() || 'anon'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    saveProfile({ username: username.trim(), avatarSeed: username.trim() })
    router.replace('/feed')
  }

  return (
    <main className="min-h-screen ruled flex flex-col items-center justify-center px-6">
      <motion.div
        className="note note--tape w-full max-w-sm flex flex-col gap-9 px-7 py-9"
        style={{ '--tilt': '-0.8deg' } as React.CSSProperties}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >

        {/* Portada */}
        <div className="flex flex-col gap-1">
          <h1 className="font-hand-title text-[44px] text-ink leading-[0.95]">
            Chismógrafo
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-soft mt-2">
            el cuaderno de los secretos.
          </p>
        </div>

        {/* Avatar preview = foto pegada */}
        <div className="flex items-center gap-4">
          <ViewTransition name="user-avatar">
            <motion.div key={seed} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <Avatar seed={seed} size={72} frame="polaroid" />
            </motion.div>
          </ViewTransition>
          <AnimatePresence>
            {username.trim() && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1"
              >
                <span className="font-hand text-[22px] text-ink leading-none">{username}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">tu cara aquí</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              este cuaderno es de:
            </label>
            <input
              type="text"
              placeholder="tu nombre secreto"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
              className="w-full bg-transparent border-b border-dashed border-ink-faint focus:border-ink font-hand text-[24px] text-ink placeholder-ink-faint py-1.5 outline-none transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={!username.trim()}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 text-[12px] font-black uppercase tracking-widest disabled:cursor-not-allowed transition-all"
            style={{
              background: username.trim() ? 'var(--highlight)' : 'var(--state-disabled-bg)',
              color: username.trim() ? 'var(--highlight-ink)' : 'var(--state-disabled-ink)',
            }}
          >
            ábrelo →
          </motion.button>
        </form>

        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint leading-relaxed">
          tu perfil vive solo en este dispositivo.
          <br />nadie sabe quién escribe.
        </p>

      </motion.div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewTransition } from 'react'
import { saveProfile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'

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
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-xs flex flex-col gap-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >

        {/* Logo */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[36px] font-black tracking-tighter text-white leading-none">
            CHISMÓ<br />GRAFO
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#282828] mt-2">
            El chisme, anónimo.
          </p>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <ViewTransition name="user-avatar">
            <motion.div
              key={seed}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Avatar seed={seed} size={72} className="overflow-hidden" style={{ borderRadius: 0 }} />
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
                <span className="text-[14px] font-black uppercase tracking-widest text-white">{username}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#282828]">Tu avatar</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#333]">
              Nombre de usuario
            </label>
            <input
              type="text"
              placeholder="tunombre"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
              className="w-full bg-transparent border-b border-[#1c1c1c] focus:border-white text-white placeholder-[#222] py-2.5 text-[16px] font-medium outline-none transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={!username.trim()}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 text-[12px] font-black uppercase tracking-widest text-black disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
            style={{ background: username.trim() ? BRAND : '#1a1a1a', color: username.trim() ? '#000' : '#333' }}
          >
            Entrar
          </motion.button>
        </form>

        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1c1c1c] leading-relaxed">
          Tu perfil vive solo en este dispositivo.
          <br />Nadie sabe quién chismea.
        </p>

      </motion.div>
    </main>
  )
}

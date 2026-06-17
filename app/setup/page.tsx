'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ViewTransition } from 'react'
import { saveProfile } from '@/lib/profile'
import Avatar from '@/components/Avatar'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/variants'

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
    <main className="min-h-screen bg-[#101010] flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-xs flex flex-col items-center gap-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.div variants={staggerItem} className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tracking-tight text-white">Chismógrafo</span>
          <span className="text-sm text-[#777]">El chisme, anónimo.</span>
        </motion.div>

        {/* Avatar preview */}
        <motion.div variants={staggerItem} className="flex flex-col items-center gap-3">
          <ViewTransition name="user-avatar">
            <motion.div
              key={seed}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Avatar seed={seed} size={88} className="rounded-full overflow-hidden" />
            </motion.div>
          </ViewTransition>
          {username.trim() && (
            <motion.span
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-xs text-[#666]"
            >
              Tu avatar se genera de tu nombre
            </motion.span>
          )}
        </motion.div>

        {/* Form */}
        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#666] uppercase tracking-widest">Nombre de usuario</label>
            <input
              type="text"
              placeholder="@tunombre"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
              className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-white text-white placeholder-[#444] py-2 text-base outline-none transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={!username.trim()}
            whileTap={{ scale: 0.97 }}
            whileHover={{ borderColor: '#fff' }}
            className="w-full mt-2 border border-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            Entrar
          </motion.button>
        </motion.form>

        <motion.p variants={staggerItem} className="text-xs text-[#444] text-center">
          Tu perfil solo existe en este dispositivo.<br />Nadie sabe quién chismea.
        </motion.p>
      </motion.div>
    </main>
  )
}

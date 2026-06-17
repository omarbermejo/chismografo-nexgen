'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveProfile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

export default function SetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  const seed = username.trim() || 'default'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    saveProfile({ username: username.trim(), avatarSeed: username.trim() })
    router.replace('/feed')
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Chismógrafo</h1>
        <p className="text-zinc-400 text-sm text-center">Elige tu nombre de usuario. Nadie sabrá quién eres cuando chismees.</p>

        <Avatar seed={seed} size={96} className="rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700" />

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tu nombre de usuario..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={24}
            autoFocus
            className="w-full rounded-xl bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors text-sm"
          >
            Entrar al chismógrafo
          </button>
        </form>
      </div>
    </main>
  )
}

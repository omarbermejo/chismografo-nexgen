'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import { getChismes, postChisme, type Chisme } from '@/lib/api'
import Avatar from '@/components/Avatar'

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) { router.replace('/setup'); return }
    setProfile(p)
    loadChismes()
  }, [router])

  async function loadChismes() {
    try {
      const data = await getChismes()
      setChismes(data)
    } finally {
      setLoading(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    try {
      const nuevo = await postChisme(texto.trim())
      setChismes(prev => [nuevo, ...prev])
      setTexto('')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleLogout() {
    clearProfile()
    router.replace('/setup')
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  if (!profile) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Chismógrafo</h1>
        <div className="flex items-center gap-3">
          <Avatar seed={profile.avatarSeed} size={32} className="rounded-full overflow-hidden bg-zinc-800" />
          <span className="text-sm text-zinc-300">{profile.username}</span>
          <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Compose */}
        <form onSubmit={handlePost} className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Suelta el chisme anónimamente..."
            rows={3}
            maxLength={500}
            className="w-full bg-transparent text-white placeholder-zinc-500 resize-none outline-none text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">{texto.length}/500</span>
            <button
              type="submit"
              disabled={!texto.trim() || sending}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold transition-colors"
            >
              {sending ? 'Enviando...' : 'Chismear'}
            </button>
          </div>
        </form>

        {/* Feed */}
        {loading ? (
          <p className="text-center text-zinc-500 text-sm">Cargando chismes...</p>
        ) : chismes.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm">Nadie ha chismeado aún. Sé el primero.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {chismes.map(c => (
              <article key={c.id} className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">{c.texto}</p>
                <span className="text-xs text-zinc-500">{timeAgo(c.created_at)}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

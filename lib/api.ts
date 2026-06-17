const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const EMOJIS = ['🔥', '💀', '👀', '😭'] as const
export type Emoji = typeof EMOJIS[number]

export interface Chisme {
  id: string
  texto: string
  username: string
  avatar_seed: string
  created_at: string
  reacciones: Record<Emoji, number>
}

export async function getChismes(): Promise<Chisme[]> {
  const res = await fetch(`${BASE}/chismes`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar chismes')
  return res.json()
}

export async function postChisme(texto: string, username: string, avatar_seed: string): Promise<Chisme> {
  const res = await fetch(`${BASE}/chismes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, username, avatar_seed }),
  })
  if (!res.ok) throw new Error('Error al publicar chisme')
  return res.json()
}

export async function reaccionar(chismeId: string, emoji: Emoji): Promise<void> {
  await fetch(`${BASE}/chismes/${chismeId}/reacciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  })
}

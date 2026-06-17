const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface Chisme {
  id: string
  texto: string
  username: string
  avatar_seed: string
  created_at: string
  like_count: number
  repost_count: number
  comment_count: number
}

export interface Comentario {
  id: string
  chisme_id: string
  texto: string
  username: string
  avatar_seed: string
  created_at: string
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

export async function darLike(chismeId: string): Promise<void> {
  await fetch(`${BASE}/chismes/${chismeId}/likes`, { method: 'POST' })
}

export async function darRepost(chismeId: string): Promise<void> {
  await fetch(`${BASE}/chismes/${chismeId}/reposts`, { method: 'POST' })
}

export async function getComentarios(chismeId: string): Promise<Comentario[]> {
  const res = await fetch(`${BASE}/chismes/${chismeId}/comentarios`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar comentarios')
  return res.json()
}

export async function postComentario(
  chismeId: string,
  texto: string,
  username: string,
  avatar_seed: string,
): Promise<Comentario> {
  const res = await fetch(`${BASE}/chismes/${chismeId}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, username, avatar_seed }),
  })
  if (!res.ok) throw new Error('Error al comentar')
  return res.json()
}

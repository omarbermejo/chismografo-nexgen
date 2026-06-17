const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Chismes ──────────────────────────────────────────────────────────────────

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

export async function getChismes(page = 1, limit = 15): Promise<{ data: Chisme[]; hasMore: boolean }> {
  const res = await fetch(`${BASE}/chismes?page=${page}&limit=${limit}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar chismes')
  return res.json()
}

export async function getTrending(): Promise<Chisme[]> {
  const res = await fetch(`${BASE}/chismes/trending`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar trending')
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

export async function getChisme(id: string): Promise<Chisme> {
  const res = await fetch(`${BASE}/chismes/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Chisme no encontrado')
  return res.json()
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

// ── Cuestionarios ─────────────────────────────────────────────────────────────

export interface Cuestionario {
  id: string
  titulo: string
  username: string
  avatar_seed: string
  created_at: string
  pregunta_count: number
  participant_count: number
}

export interface Pregunta {
  id: string
  cuestionario_id: string
  texto: string
  orden: number
}

export interface Respuesta {
  id: string
  pregunta_id: string
  cuestionario_id: string
  username: string
  avatar_seed: string
  texto: string
  created_at: string
}

export interface PreguntaConRespuestas extends Pregunta {
  respuestas: Respuesta[]
}

export interface CuestionarioDetalle extends Cuestionario {
  preguntas: PreguntaConRespuestas[]
}

export async function getCuestionarios(): Promise<Cuestionario[]> {
  const res = await fetch(`${BASE}/cuestionarios`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar cuestionarios')
  return res.json()
}

export async function getCuestionario(id: string): Promise<CuestionarioDetalle> {
  const res = await fetch(`${BASE}/cuestionarios/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Cuestionario no encontrado')
  return res.json()
}

export async function postCuestionario(
  titulo: string,
  preguntas: string[],
  username: string,
  avatar_seed: string,
): Promise<Cuestionario> {
  const res = await fetch(`${BASE}/cuestionarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, preguntas, username, avatar_seed }),
  })
  if (!res.ok) throw new Error('Error al crear cuestionario')
  return res.json()
}

export async function responderCuestionario(
  id: string,
  respuestas: { pregunta_id: string; texto: string }[],
  username: string,
  avatar_seed: string,
): Promise<void> {
  const res = await fetch(`${BASE}/cuestionarios/${id}/responder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respuestas, username, avatar_seed }),
  })
  if (!res.ok) throw new Error('Error al responder')
}

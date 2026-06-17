const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface Chisme {
  id: string
  texto: string
  created_at: string
}

export async function getChismes(): Promise<Chisme[]> {
  const res = await fetch(`${BASE}/chismes`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al cargar chismes')
  return res.json()
}

export async function postChisme(texto: string): Promise<Chisme> {
  const res = await fetch(`${BASE}/chismes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  })
  if (!res.ok) throw new Error('Error al publicar chisme')
  return res.json()
}

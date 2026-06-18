const KEY = 'chismografo_bookmarks'

function getLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function setLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val))
}

export function getBookmarks(): string[] {
  return getLS<string[]>(KEY, [])
}

export function addBookmark(id: string): void {
  const current = getBookmarks()
  if (!current.includes(id)) setLS(KEY, [id, ...current])
}

export function removeBookmark(id: string): void {
  setLS(KEY, getBookmarks().filter(b => b !== id))
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id)
}

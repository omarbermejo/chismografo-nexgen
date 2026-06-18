'use client'

import { useEffect, useState, startTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Journal, FireFlame, EditPencil, LogOut, SunLight, HalfMoon, Bookmark } from 'iconoir-react'
import { ViewTransition } from 'react'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import { useTheme } from '@/lib/theme'
import Avatar from '@/components/Avatar'

const NAV = [
  { label: 'feed', icon: Journal, path: '/feed' },
  { label: 'lo más chismeado', icon: FireFlame, path: '/trending' },
  { label: 'guardados', icon: Bookmark, path: '/guardados' },
]

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const { theme, toggle } = useTheme()

  useEffect(() => { setProfile(getProfile()) }, [])

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-[220px] shrink-0 h-full border-r border-line flex flex-col bg-paper-sunken"
    >
      {/* ── Lomo / logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="px-5 pt-7 pb-6 border-b border-line select-none"
      >
        <span className="font-hand-title text-[30px] text-ink leading-[0.95] block">
          Chismó<br />grafo
        </span>
      </motion.div>

      {/* ── Pestañas ── */}
      <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1">
        {NAV.map((item, i) => {
          const isActive =
            pathname === item.path ||
            (item.path === '/feed' && (pathname === '/' || pathname.startsWith('/feed')))

          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16 + i * 0.07, duration: 0.28 }}
              onClick={() => startTransition(() => router.push(item.path))}
              whileHover={!isActive ? { backgroundColor: 'var(--state-hover)' } : undefined}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-3 px-3 py-2.5 text-left w-full transition-colors"
            >
              {/* Trazo de resaltador activo */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 -z-0"
                  style={{ background: 'var(--highlight-soft)', borderLeft: '3px solid var(--highlight)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div style={{ color: isActive ? 'var(--highlight)' : 'var(--ink-soft)', transition: 'color 0.2s' }} className="relative z-10">
                <item.icon width={16} height={16} />
              </div>
              <span
                style={{ color: isActive ? 'var(--ink)' : 'var(--ink-soft)', transition: 'color 0.2s' }}
                className="text-[12px] font-black uppercase tracking-widest relative z-10"
              >
                {item.label}
              </span>
            </motion.button>
          )
        })}

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mx-3 my-3 border-t border-line"
        />

        {/* ── Pasa una hoja ── */}
        <motion.button
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.34, duration: 0.28 }}
          onClick={() => startTransition(() => router.push('/cuestionario/nuevo'))}
          whileHover={{ backgroundColor: 'var(--highlight-soft)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-3 py-2.5 text-left w-full transition-colors"
        >
          <EditPencil width={16} height={16} style={{ color: 'var(--highlight)' }} />
          <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: 'var(--highlight)' }}>
            pasa una hoja
          </span>
        </motion.button>
      </nav>

      {/* ── Toggle de tema ── */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.36, duration: 0.28 }}
        onClick={toggle}
        whileTap={{ scale: 0.96 }}
        className="mx-3 mb-1 flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--state-hover)]"
        title={theme === 'dark' ? 'pasar a modo día' : 'pasar a modo noche'}
      >
        {theme === 'dark'
          ? <SunLight width={16} height={16} color="var(--ink-soft)" />
          : <HalfMoon width={16} height={16} color="var(--ink-soft)" />
        }
        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">
          {theme === 'dark' ? 'modo día' : 'modo noche'}
        </span>
      </motion.button>

      {/* ── Perfil ── */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28 }}
          className="px-4 py-4 border-t border-line flex items-center gap-3"
        >
          <ViewTransition name="user-avatar">
            <Avatar seed={profile.avatarSeed} size={32} frame="tape" className="shrink-0" />
          </ViewTransition>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-ink truncate">
              {profile.username}
            </p>
          </div>
          <motion.button
            onClick={() => { clearProfile(); router.replace('/setup') }}
            whileTap={{ scale: 0.88 }}
            title="cerrar el cuaderno"
            className="shrink-0 p-1.5 transition-colors hover:bg-[var(--state-hover)]"
          >
            <LogOut width={14} height={14} color="var(--ink-soft)" />
          </motion.button>
        </motion.div>
      )}
    </motion.aside>
  )
}

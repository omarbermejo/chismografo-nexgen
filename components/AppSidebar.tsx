'use client'

import { useEffect, useState, startTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { HomeSimple, FireFlame, Notes, LogOut } from 'iconoir-react'
import { ViewTransition } from 'react'
import { getProfile, clearProfile, type Profile } from '@/lib/profile'
import Avatar from '@/components/Avatar'

const BRAND = '#39e079'

const NAV = [
  { label: 'Feed',     icon: HomeSimple, path: '/feed' },
  { label: 'Trending', icon: FireFlame,  path: '/trending' },
]

export default function AppSidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => { setProfile(getProfile()) }, [])

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-[220px] shrink-0 h-full border-r border-[#181818] flex flex-col bg-black"
    >
      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="px-5 pt-7 pb-6 border-b border-[#181818] select-none"
      >
        <span className="text-[26px] font-black tracking-tighter text-white leading-none block">
          CHISMÓ<br />GRAFO
        </span>
      </motion.div>

      {/* ── Nav items ── */}
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
              whileHover={!isActive ? { backgroundColor: 'rgba(255,255,255,0.03)' } : undefined}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-3 px-3 py-2.5 text-left w-full transition-colors"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px]"
                  style={{ background: BRAND }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <motion.div
                animate={{ color: isActive ? BRAND : '#383838' }}
                transition={{ duration: 0.2 }}
              >
                <item.icon width={16} height={16} />
              </motion.div>
              <motion.span
                animate={{ color: isActive ? BRAND : '#383838' }}
                transition={{ duration: 0.2 }}
                className="text-[12px] font-black uppercase tracking-widest"
              >
                {item.label}
              </motion.span>
            </motion.button>
          )
        })}

        {/* ── Divider ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mx-3 my-3 border-t border-[#111]"
        />

        {/* ── Nueva encuesta ── */}
        <motion.button
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.34, duration: 0.28 }}
          onClick={() => startTransition(() => router.push('/cuestionario/nuevo'))}
          whileHover={{ backgroundColor: 'rgba(57,224,121,0.04)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-3 py-2.5 text-left w-full transition-colors"
        >
          <Notes width={16} height={16} style={{ color: BRAND }} />
          <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: BRAND }}>
            Nueva encuesta
          </span>
        </motion.button>
      </nav>

      {/* ── Profile ── */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28 }}
          className="px-4 py-4 border-t border-[#181818] flex items-center gap-3"
        >
          <ViewTransition name="user-avatar">
            <Avatar
              seed={profile.avatarSeed}
              size={30}
              className="overflow-hidden shrink-0"
              style={{ borderRadius: 0 }}
            />
          </ViewTransition>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-white truncate">
              {profile.username}
            </p>
          </div>
          <motion.button
            onClick={() => { clearProfile(); router.replace('/setup') }}
            whileTap={{ scale: 0.88 }}
            title="Cerrar sesión"
            className="shrink-0 p-1.5 transition-colors"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <LogOut width={14} height={14} color="#383838" />
          </motion.button>
        </motion.div>
      )}
    </motion.aside>
  )
}

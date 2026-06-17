'use client'

import { usePathname } from 'next/navigation'
import AppSidebar from './AppSidebar'

const NO_SIDEBAR = ['/setup']

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!showSidebar) return <>{children}</>

  return (
    <div className="h-screen overflow-hidden bg-black text-[#f0f0f0] flex">
      <AppSidebar />
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/profile'

export default function Root() {
  const router = useRouter()

  useEffect(() => {
    const profile = getProfile()
    router.replace(profile ? '/feed' : '/setup')
  }, [router])

  return null
}

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { NAV_CURRENT_PATH_KEY, NAV_PREV_PATH_KEY } from '@/lib/navigationHistory'

export function NavigationTracker() {
  const pathname = usePathname()
  const initialized = useRef(false)

  useEffect(() => {
    const storedCurrent = sessionStorage.getItem(NAV_CURRENT_PATH_KEY)

    if (!initialized.current) {
      initialized.current = true
      if (!storedCurrent) {
        sessionStorage.setItem(NAV_CURRENT_PATH_KEY, pathname)
      }
      return
    }

    if (storedCurrent !== pathname) {
      sessionStorage.setItem(NAV_PREV_PATH_KEY, storedCurrent ?? '')
      sessionStorage.setItem(NAV_CURRENT_PATH_KEY, pathname)
    }
  }, [pathname])

  return null
}

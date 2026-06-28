'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { CSSProperties, MouseEvent, useEffect, useState } from 'react'
import { resolveBackLabel, canGoBackInHistory, pathToLabel } from '@/lib/backNavigation'

function BackChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
    </svg>
  )
}

interface BackLinkProps {
  fallbackHref: string
  fallbackLabel?: string
  className?: string
  style?: CSSProperties
  showIcon?: boolean
}

export function BackLink({
  fallbackHref,
  fallbackLabel,
  className = 'inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline',
  style,
  showIcon = true,
}: BackLinkProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [label, setLabel] = useState(() => {
    const destinationLabel = fallbackLabel ?? pathToLabel(fallbackHref)
    return `Back to ${destinationLabel}`
  })

  useEffect(() => {
    setLabel(resolveBackLabel(fallbackHref, fallbackLabel))
  }, [fallbackHref, fallbackLabel, pathname])

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (canGoBackInHistory()) {
      e.preventDefault()
      router.back()
    }
  }

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className} style={style}>
      {showIcon && <BackChevron />}
      {label}
    </Link>
  )
}

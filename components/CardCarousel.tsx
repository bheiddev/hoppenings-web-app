'use client'

import { Children, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Colors } from '@/lib/colors'

type CardCarouselProps = {
  children: ReactNode
  className?: string
  itemClassName?: string
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === 'left' ? 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' : 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'}
        fill="currentColor"
      />
    </svg>
  )
}

export function CardCarousel({
  children,
  className = '',
  itemClassName = 'w-[min(85vw,320px)] sm:w-[340px]',
}: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateScrollButtons()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)
    const observer = new ResizeObserver(updateScrollButtons)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
      observer.disconnect()
    }
  }, [updateScrollButtons, children])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction === 'left' ? -el.clientWidth * 0.9 : el.clientWidth * 0.9,
      behavior: 'smooth',
    })
  }

  const items = Children.toArray(children).filter(Boolean)
  if (items.length === 0) return null

  const buttonStyle = {
    backgroundColor: Colors.primary,
    color: Colors.primaryDark,
  }

  return (
    <div className={`relative ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full shadow-md transition-opacity hover:opacity-90 -ml-2"
          style={buttonStyle}
        >
          <Chevron direction="left" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, index) => (
          <div key={index} className={`snap-start shrink-0 ${itemClassName}`}>
            <div className="h-full">{child}</div>
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full shadow-md transition-opacity hover:opacity-90 -mr-2"
          style={buttonStyle}
        >
          <Chevron direction="right" />
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

export default function AppBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner has been dismissed
    const dismissed = localStorage.getItem('appBannerDismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    // Add padding to body when banner is visible
    if (isVisible) {
      document.body.style.paddingTop = '56px' // Approximate banner height
    } else {
      document.body.style.paddingTop = '0'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.paddingTop = '0'
    }
  }, [isVisible])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('appBannerDismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 shadow-md"
      style={{ backgroundColor: Colors.background }}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-4 max-w-7xl mx-auto">
        <p 
          className="text-xs sm:text-sm font-medium flex-1 min-w-0"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Download the Hoppenings mobile app for the full experience.
        </p>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link 
            href="https://apps.apple.com/us/app/hoppenings/id6749239343"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Apple.png"
              alt="Download on the App Store"
              width={120}
              height={40}
              className="h-6 sm:h-8 w-auto"
              unoptimized
            />
          </Link>
          
          <Link 
            href="https://play.google.com/store/apps/details?id=com.breweryevents.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/PlayImage.png"
              alt="Get it on Google Play"
              width={135}
              height={40}
              className="h-6 sm:h-8 w-auto"
              unoptimized
            />
          </Link>
        </div>

        <button
          onClick={handleClose}
          className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Close banner"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ color: Colors.textDark }}
          >
            <path 
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" 
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}


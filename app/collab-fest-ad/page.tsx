import { Metadata } from 'next'
import { Colors } from '@/lib/colors'

export const metadata: Metadata = {
  title: 'Collab Fest | Hoppenings',
  description: 'Hoppenings — brewery events, releases, and breweries.',
  robots: { index: false, follow: false },
}

export const viewport = {
  themeColor: Colors.backgroundDark,
}

/** Tweak these lines for today’s TV spot */
const HEADLINE = 'COLLAB FEST'
const TAGLINE = 'Brewery events & beer releases — Colorado and beyond.'
const CALLOUT = 'Hoppenings'

export default function CollabFestAdPage() {
  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 sm:px-10 text-center"
      style={{
        background: `linear-gradient(165deg, ${Colors.backgroundDark} 0%, ${Colors.backgroundMedium} 45%, #6b2f2e 100%)`,
      }}
    >
      <div className="max-w-5xl w-full flex flex-col items-center gap-6 sm:gap-10">
        <p
          className="text-[clamp(2.5rem,12vw,7rem)] leading-[0.95] tracking-tight uppercase"
          style={{
            color: Colors.primary,
            fontFamily: 'var(--font-fjalla-one)',
            textShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {HEADLINE}
        </p>
        <div
          className="h-1 w-24 sm:w-32 rounded-full"
          style={{ backgroundColor: Colors.primary }}
          aria-hidden
        />
        <p
          className="text-[clamp(1.125rem,3.5vw,2rem)] font-medium max-w-3xl leading-snug"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          {TAGLINE}
        </p>
        <p
          className="text-[clamp(1.75rem,6vw,3.5rem)] font-bold mt-2 sm:mt-4"
          style={{
            color: Colors.textPrimary,
            fontFamily: 'var(--font-fjalla-one)',
            letterSpacing: '0.02em',
          }}
        >
          {CALLOUT}
        </p>
        <p
          className="text-[clamp(1rem,2.5vw,1.35rem)] opacity-90 max-w-xl"
          style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Get the app — search <span style={{ color: Colors.primary }}>Hoppenings</span> on the App Store
          &amp; Google Play.
        </p>
      </div>
    </main>
  )
}

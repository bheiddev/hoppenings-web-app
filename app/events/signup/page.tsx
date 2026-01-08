import { Metadata } from 'next'
import { Colors } from '@/lib/colors'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Event Sign Up | Hoppenings',
  description: 'Sign up for our upcoming event in February. Join us for a great time!',
  openGraph: {
    title: 'Event Sign Up | Hoppenings',
    description: 'Sign up for our upcoming event in February.',
    type: 'website',
  },
}

export default function EventSignUpPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 mb-4 text-sm font-medium hover:underline"
            style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
            Back to Events
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
            SPEED DATING & MIXER @ OCC
          </h1>
        </div>

        {/* Google Form Embed */}
        <div className="mb-8">
          <div 
            className="rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: Colors.background,
              padding: '1rem',
            }}
          >
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSdRaFrifumEKc6YpoPWqDrGUrlK0fK1Pi5g9l9gtRXYUD_Uaw/viewform?embedded=true"
              width="100%"
              height="997"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              style={{
                minHeight: '600px',
                border: 'none',
              }}
              title="Speed Dating & Mixer Sign Up Form"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </div>
  )
}


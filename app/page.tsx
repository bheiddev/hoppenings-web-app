import Link from 'next/link'
import { Colors } from '@/lib/colors'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold mb-6" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          Welcome to Hoppenings
        </h1>
        <p className="text-xl mb-12" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
          Discover the latest brewery events, beer releases, and brewery information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/events"
            className="p-8 rounded-lg border-2 transition-all hover:scale-105"
            style={{ 
              backgroundColor: Colors.background,
              borderColor: Colors.primary,
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}>
              Events
            </h2>
            <p style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              Find brewery events, tastings, and happenings
            </p>
          </Link>
          <Link
            href="/releases"
            className="p-8 rounded-lg border-2 transition-all hover:scale-105"
            style={{ 
              backgroundColor: Colors.background,
              borderColor: Colors.primary,
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}>
              Releases
            </h2>
            <p style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              Stay updated on the latest beer releases
            </p>
          </Link>
          <Link
            href="/breweries"
            className="p-8 rounded-lg border-2 transition-all hover:scale-105"
            style={{ 
              backgroundColor: Colors.background,
              borderColor: Colors.primary,
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}>
              Breweries
            </h2>
            <p style={{ color: Colors.textSecondary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
              Explore local breweries and craft beer makers
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

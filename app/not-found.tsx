import Link from 'next/link'
import { Colors } from '@/lib/colors'

export const metadata = {
  title: 'Page Not Found | Hoppenings',
  description: 'The page you\'re looking for doesn\'t exist. Explore brewery events, beer releases, and breweries.',
  robots: 'noindex, nofollow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="text-center px-4 max-w-md">
        <h1 className="text-4xl font-bold mb-4" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          Page not found
        </h1>
        <p className="text-lg mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
          This page doesn&apos;t exist or may have been moved. Here are some helpful links:
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
            style={{
              backgroundColor: Colors.primary,
              color: Colors.primaryDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Home
          </Link>
          <Link
            href="/releases"
            className="inline-flex justify-center gap-2 px-6 py-3 rounded-full font-semibold border transition-colors"
            style={{
              borderColor: Colors.primary,
              color: Colors.textDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Beer Releases
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center gap-2 px-6 py-3 rounded-full font-semibold border transition-colors"
            style={{
              borderColor: Colors.primary,
              color: Colors.textDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Events
          </Link>
          <Link
            href="/breweries"
            className="inline-flex justify-center gap-2 px-6 py-3 rounded-full font-semibold border transition-colors"
            style={{
              borderColor: Colors.primary,
              color: Colors.textDark,
              fontFamily: 'var(--font-fjalla-one)',
            }}
          >
            Breweries
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Colors } from '@/lib/colors'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.backgroundMedium }}>
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
          Beer Release Not Found
        </h1>
        <p className="text-lg mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
          The beer release you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/releases"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
          style={{ 
            backgroundColor: Colors.primary,
            color: Colors.primaryDark,
            fontFamily: 'var(--font-fjalla-one)',
          }}
        >
          Back to Releases
        </Link>
      </div>
    </div>
  )
}


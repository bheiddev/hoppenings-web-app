import { BackLink } from '@/components/BackLink'
import { Colors } from '@/lib/colors'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.surfaceMedium }}>
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold mb-4" style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}>
          Event Not Found
        </h1>
        <p className="text-lg mb-8" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-be-vietnam-pro)' }}>
          The event you're looking for doesn't exist or has been removed.
        </p>
        <BackLink
          fallbackHref="/events"
          showIcon={false}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
          style={{
            backgroundColor: Colors.primary,
            color: Colors.onPrimary,
            fontFamily: 'var(--font-fjalla-one)',
          }}
        />
      </div>
    </div>
  )
}


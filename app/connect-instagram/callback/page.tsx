import { Suspense } from 'react'
import { Colors } from '@/lib/colors'
import CallbackClient from './CallbackClient'

export default function ConnectInstagramCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: Colors.backgroundMedium }}>
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-solid"
                style={{
                  borderColor: Colors.dividerLight,
                  borderTopColor: Colors.primary,
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div className="text-lg font-bold" style={{ color: Colors.textPrimary, fontFamily: 'var(--font-fjalla-one)' }}>
                Connecting your Instagram…
              </div>
              <style>{`
                @keyframes spin {
                  0% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  )
}


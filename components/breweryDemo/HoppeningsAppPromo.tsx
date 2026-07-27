import Image from 'next/image'
import Link from 'next/link'
import { Colors } from '@/lib/colors'

const BENEFITS = [
  { title: 'Brewery Passport', detail: 'Check in and collect stamps as you explore.' },
  { title: 'New Beer Releases', detail: 'Know what’s pouring before you walk in.' },
  { title: 'Tonight’s Hoppenings', detail: 'Events, food trucks, and live music near you.' },
]

export function HoppeningsAppPromo() {
  return (
    <section
      className="mb-10 rounded-xl overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
      style={{ backgroundColor: Colors.backgroundDark }}
    >
      <div className="max-w-3xl">
        <p
          className="text-sm font-semibold uppercase tracking-wider mb-2"
          style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Get the app
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold uppercase tracking-wide mb-3"
          style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Everything happening at Mash Mechanix — in your pocket
        </h2>
        <p
          className="text-sm sm:text-base mb-6 max-w-xl"
          style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
        >
          Download Hoppenings for taproom events, beer releases, and what’s on tonight — powered by the same data you see here.
        </p>

        <ul className="space-y-3 mb-8">
          {BENEFITS.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: Colors.success }}
                aria-hidden
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#FFFFFF" />
                </svg>
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
                >
                  {item.title}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-be-vietnam-pro)' }}
                >
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="https://apps.apple.com/us/app/hoppenings/id6749239343"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-90 transition-opacity"
          >
            <Image
              src="/Apple.png"
              alt="Download on the App Store"
              width={140}
              height={42}
              className="h-10 w-auto"
              unoptimized
            />
          </Link>
          <Link
            href="https://play.google.com/store/apps/details?id=com.breweryevents.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-90 transition-opacity"
          >
            <Image
              src="/PlayImage.png"
              alt="Get it on Google Play"
              width={155}
              height={42}
              className="h-10 w-auto"
              unoptimized
            />
          </Link>
        </div>
      </div>
    </section>
  )
}

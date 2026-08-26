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
    <section className="mb-10 border-t border-white/10 pt-12">
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
        style={{ color: Colors.accent, fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Get the app
      </p>
      <h2
        className="mb-4 max-w-2xl text-2xl font-bold uppercase tracking-wide sm:text-4xl"
        style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
      >
        Everything happening at Mash Mechanix — in your pocket
      </h2>
      <p
        className="mb-8 max-w-xl text-base leading-relaxed"
        style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Download Hoppenings for taproom events, beer releases, and what’s on tonight — powered by the
        same data you see here.
      </p>

      <ul className="mb-10 flex max-w-xl flex-col">
        {BENEFITS.map((item) => (
          <li key={item.title} className="border-t border-white/10 py-4">
            <p
              className="text-base font-bold uppercase tracking-wide"
              style={{ color: Colors.textOnDark, fontFamily: 'var(--font-fjalla-one)' }}
            >
              {item.title}
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: 'rgba(249, 247, 242, 0.65)', fontFamily: 'var(--font-be-vietnam-pro)' }}
            >
              {item.detail}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="https://apps.apple.com/us/app/hoppenings/id6749239343"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-90"
        >
          <Image
            src="/AppleAppStore.png"
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
          className="transition-opacity hover:opacity-90"
        >
          <Image
            src="/googleplaytan.png"
            alt="Get it on Google Play"
            width={155}
            height={42}
            className="h-10 w-auto"
            unoptimized
          />
        </Link>
      </div>
    </section>
  )
}

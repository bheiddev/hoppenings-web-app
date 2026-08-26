import Image from 'next/image'
import { PoshCta } from '@/components/PoshPageShell'
import { Colors } from '@/lib/colors'

const BENEFITS = [
  { title: 'Collect Custom Brewery Taps', detail: 'Check in and collect stamps as you explore.' },
  { title: 'New Beer Releases', detail: 'Know what’s pouring before you walk in.' },
  { title: 'Tonight’s Hoppenings', detail: 'Events, food trucks, and live music near you.' },
]

export function HoppeningsAppPromo({ region }: { region: string }) {
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
        Everything Hoppening across {region} in your pocket
      </h2>
      <p
        className="mb-10 max-w-xl text-base leading-relaxed"
        style={{ color: 'rgba(249, 247, 242, 0.75)', fontFamily: 'var(--font-be-vietnam-pro)' }}
      >
        Download Hoppenings for taproom events, beer releases, and what’s on tonight — powered by the
        same data you see here.
      </p>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
        <div className="flex min-h-0 flex-col">
          <ul className="flex flex-col">
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

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PoshCta href="https://apps.apple.com/us/app/hoppenings/id6749239343" external>
              App Store
            </PoshCta>
            <PoshCta href="https://play.google.com/store/apps/details?id=com.breweryevents.app" external>
              Google Play
            </PoshCta>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[160px] md:mx-0 md:max-w-[180px] lg:max-w-[200px]">
          <Image
            src="/HoppeningsIphoneBent.png"
            alt="Hoppenings app on iPhone"
            width={1857}
            height={3096}
            className="h-auto w-full"
            sizes="(max-width: 768px) 160px, 200px"
            priority={false}
          />
        </div>
      </div>
    </section>
  )
}

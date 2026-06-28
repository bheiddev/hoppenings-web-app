import { BreweryHours } from '@/types/supabase'
import { getMountainTimeNow } from '@/lib/utils'

export type BreweryHoursStatus = 'open' | 'closed' | 'opening_soon' | 'closing_soon'

export type BreweryEventIcon =
  | 'trivia'
  | 'running'
  | 'coloring'
  | 'cycling'
  | 'bingo'
  | 'music'
  | 'generic'

const OPENING_SOON_MINUTES = 60
const CLOSING_SOON_MINUTES = 60

const DAY_FIELDS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

function timeToMinutes(time: string | null): number | null {
  if (!time?.trim()) return null
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}

function getMountainWeekdayIndex(dateYmd: string): number {
  const [year, month, day] = dateYmd.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const weekday = utc.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
  })
  const index = DAY_FIELDS.indexOf(weekday.toLowerCase() as (typeof DAY_FIELDS)[number])
  return index >= 0 ? index : 0
}

export function getBreweryHoursStatus(
  hours: BreweryHours | null | undefined,
  now = getMountainTimeNow()
): BreweryHoursStatus {
  if (!hours) return 'closed'

  const dayName = DAY_FIELDS[getMountainWeekdayIndex(now.date)]
  const openTime = hours[`${dayName}_open` as keyof BreweryHours] as string | null
  const closeTime = hours[`${dayName}_close` as keyof BreweryHours] as string | null

  if (!openTime || !closeTime) return 'closed'

  const openMin = timeToMinutes(openTime)
  const closeMin = timeToMinutes(closeTime)
  const currentMin = now.hours * 60 + now.minutes

  if (openMin === null || closeMin === null) return 'closed'

  if (currentMin >= openMin && currentMin < closeMin) {
    if (closeMin - currentMin <= CLOSING_SOON_MINUTES) return 'closing_soon'
    return 'open'
  }

  if (currentMin < openMin && openMin - currentMin <= OPENING_SOON_MINUTES) {
    return 'opening_soon'
  }

  return 'closed'
}

export function getBreweryHoursStatusLabel(status: BreweryHoursStatus): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'closed':
      return 'Closed'
    case 'opening_soon':
      return 'Opening Soon'
    case 'closing_soon':
      return 'Closing Soon'
  }
}

export function isBreweryOpenIconStatus(status: BreweryHoursStatus): boolean {
  return status === 'open' || status === 'opening_soon'
}

const EVENT_ICON_RULES: { icon: Exclude<BreweryEventIcon, 'generic'>; test: (text: string) => boolean }[] = [
  { icon: 'trivia', test: (text) => text.includes('trivia') },
  { icon: 'bingo', test: (text) => text.includes('bingo') },
  {
    icon: 'music',
    test: (text) =>
      text.includes('live music') ||
      text.includes('live band') ||
      text.includes('acoustic') ||
      text.includes('concert') ||
      text.includes('performance') ||
      text.includes('music series'),
  },
  { icon: 'coloring', test: (text) => text.includes('coloring') || text.includes('colouring') },
  {
    icon: 'running',
    test: (text) => /\brunning\b/.test(text) || /\brun club\b/.test(text) || /\brun\b/.test(text),
  },
  {
    icon: 'cycling',
    test: (text) =>
      text.includes('cycling') ||
      text.includes('bicycling') ||
      text.includes('bicycle') ||
      /\bbike\b/.test(text),
  },
]

export function matchBreweryEventIcon(title: string, description?: string | null): BreweryEventIcon {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  for (const rule of EVENT_ICON_RULES) {
    if (rule.test(text)) return rule.icon
  }
  return 'generic'
}

export const BREWERY_EVENT_ICON_SRC: Record<BreweryEventIcon, string> = {
  trivia: '/idea.svg',
  running: '/running.svg',
  coloring: '/pencil.svg',
  cycling: '/bike.svg',
  bingo: '/bingo.svg',
  music: '/music-note.svg',
  generic: '/event.svg',
}

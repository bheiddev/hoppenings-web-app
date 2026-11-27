/** Draft build modes + date-range helpers for the Social admin UI. */

export type DraftFormat = 'daily' | 'weekend' | 'week'

export const DRAFT_FORMAT_OPTIONS: { value: DraftFormat; label: string; hint: string }[] = [
  { value: 'daily', label: 'Daily', hint: 'One day' },
  { value: 'weekend', label: 'Weekend', hint: 'Fri–Sun' },
  { value: 'week', label: 'Week', hint: 'Mon–Thu' },
]

function toUtc(d: string): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}

function ymd(dt: Date): string {
  return dt.toISOString().slice(0, 10)
}

function addDays(d: string, n: number): string {
  const dt = toUtc(d)
  dt.setUTCDate(dt.getUTCDate() + n)
  return ymd(dt)
}

/** 0 = Sun … 6 = Sat (UTC on YYYY-MM-DD). */
function dow(d: string): number {
  return toUtc(d).getUTCDay()
}

/** Snap any calendar pick to the range anchor for the selected format. */
export function snapDraftDate(format: DraftFormat, date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  if (format === 'daily') return date

  const day = dow(date)
  if (format === 'weekend') {
    // Fri = 5, Sat = 6, Sun = 0 → that weekend's Friday; Mon–Thu → upcoming Friday
    if (day === 5) return date
    if (day === 6) return addDays(date, -1)
    if (day === 0) return addDays(date, -2)
    return addDays(date, 5 - day)
  }

  // week Mon–Thu: Monday of the ISO week containing `date`
  if (day === 1) return date
  if (day === 0) return addDays(date, -6)
  return addDays(date, 1 - day)
}

export function draftDatesFor(format: DraftFormat, anchor: string): string[] {
  const start = snapDraftDate(format, anchor)
  if (format === 'daily') return [start]
  if (format === 'weekend') return [start, addDays(start, 1), addDays(start, 2)]
  return [start, addDays(start, 1), addDays(start, 2), addDays(start, 3)]
}

function fmtShort(d: string): string {
  return toUtc(d).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  })
}

/** Human range shown under the date picker, e.g. "Fri–Sun · Nov 28–30". */
export function draftRangeLabel(format: DraftFormat, anchor: string): string {
  const dates = draftDatesFor(format, anchor)
  if (dates.length === 1) {
    return toUtc(dates[0]).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }
  const first = dates[0]
  const last = dates[dates.length - 1]
  const dayNum = (d: string) => String(toUtc(d).getUTCDate())
  const span =
    first.slice(0, 7) === last.slice(0, 7)
      ? `${fmtShort(first)}–${dayNum(last)}`
      : `${fmtShort(first)} – ${fmtShort(last)}`
  if (format === 'weekend') return `Fri–Sun · ${span}`
  return `Mon–Thu · ${span}`
}

export function draftFormatLabel(format: string | null | undefined): string {
  if (format === 'weekend') return 'Weekend'
  if (format === 'week') return 'Week'
  return 'Daily'
}

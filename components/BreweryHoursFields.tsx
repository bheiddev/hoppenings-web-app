'use client'

import { Colors } from '@/lib/colors'

export const BREWERY_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type BreweryDayKey = (typeof BREWERY_DAYS)[number]

export type BreweryDayHours = Record<BreweryDayKey, { open: string; close: string }>

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

function dayLabel(day: BreweryDayKey): string {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

type BreweryHoursFieldsProps = {
  dayHours: BreweryDayHours
  onChange: (day: BreweryDayKey, field: 'open' | 'close', value: string) => void
  onCopyFromPrevious: (day: BreweryDayKey) => void
  disabled?: boolean
}

export function BreweryHoursFields({
  dayHours,
  onChange,
  onCopyFromPrevious,
  disabled = false,
}: BreweryHoursFieldsProps) {
  return (
    <div className="space-y-2">
      {BREWERY_DAYS.map((day, index) => {
        const previousDay = index > 0 ? BREWERY_DAYS[index - 1] : null
        return (
          <div
            key={day}
            className="grid grid-cols-[6.5rem_1fr_1fr_auto] gap-2 items-center"
          >
            <span className="text-sm capitalize" style={{ color: Colors.textDark }}>
              {day}
            </span>
            <input
              type="time"
              value={dayHours[day].open}
              onChange={(e) => onChange(day, 'open', e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1.5 border rounded text-sm"
              style={inputStyle}
              aria-label={`${day} open`}
            />
            <input
              type="time"
              value={dayHours[day].close}
              onChange={(e) => onChange(day, 'close', e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1.5 border rounded text-sm"
              style={inputStyle}
              aria-label={`${day} close`}
            />
            {previousDay ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onCopyFromPrevious(day)}
                className="whitespace-nowrap rounded border px-2 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.surfaceLight,
                }}
                aria-label={`Copy ${dayLabel(previousDay)} hours to ${dayLabel(day)}`}
                title={`Copy ${dayLabel(previousDay)} hours`}
              >
                Copy {dayLabel(previousDay).slice(0, 3)}
              </button>
            ) : (
              <span className="w-[4.75rem]" aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}

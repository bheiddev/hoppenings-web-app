import { BreweryHours } from '@/types/supabase'

export interface HoursGroup {
  days: string[]
  open: string | null
  close: string | null
}

/**
 * Format time string to readable format (e.g., "7:00pm")
 */
export function formatTime(time: string | null): string {
  if (!time) return 'Closed'
  const date = new Date(`1970-01-01T${time}`)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`
  return `${displayHours}${displayMinutes}${ampm}`
}

/**
 * Get hours string for comparison
 */
function getHoursString(open: string | null, close: string | null): string {
  return `${open || 'closed'}-${close || 'closed'}`
}

/**
 * Group hours by matching time slots
 */
export function groupHours(hours: BreweryHours): HoursGroup[] {
  const allDays = [
    { day: 'Monday', open: hours.monday_open, close: hours.monday_close },
    { day: 'Tuesday', open: hours.tuesday_open, close: hours.tuesday_close },
    { day: 'Wednesday', open: hours.wednesday_open, close: hours.wednesday_close },
    { day: 'Thursday', open: hours.thursday_open, close: hours.thursday_close },
    { day: 'Friday', open: hours.friday_open, close: hours.friday_close },
    { day: 'Saturday', open: hours.saturday_open, close: hours.saturday_close },
    { day: 'Sunday', open: hours.sunday_open, close: hours.sunday_close },
  ]

  const groups: HoursGroup[] = []
  const processed = new Set<string>()

  // Helper to find days with matching hours
  const findMatchingDays = (targetHours: string, excludeDays: string[] = []) => {
    return allDays.filter(day => 
      getHoursString(day.open, day.close) === targetHours && 
      !excludeDays.includes(day.day)
    )
  }

  // Process weekdays (Mon-Thu) as a preferred group
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const weekdayData = allDays.filter(day => weekdays.includes(day.day))
  
  if (weekdayData.length > 0) {
    const weekdayHours = getHoursString(weekdayData[0].open, weekdayData[0].close)
    const matchingWeekdays = weekdayData.filter(day => 
      getHoursString(day.open, day.close) === weekdayHours
    )
    
    if (matchingWeekdays.length >= 2) {
      groups.push({
        days: matchingWeekdays.map(d => d.day),
        open: matchingWeekdays[0].open,
        close: matchingWeekdays[0].close
      })
      matchingWeekdays.forEach(day => processed.add(day.day))
    }
  }

  // Process remaining days
  allDays.forEach(day => {
    if (processed.has(day.day)) return
    
    const hoursString = getHoursString(day.open, day.close)
    const unprocessedDays = Array.from(processed.values())
    const matchingDays = findMatchingDays(hoursString, unprocessedDays)
    
    if (matchingDays.length > 0) {
      groups.push({
        days: matchingDays.map(d => d.day),
        open: matchingDays[0].open,
        close: matchingDays[0].close
      })
      matchingDays.forEach(d => processed.add(d.day))
    }
  })

  return groups
}

/**
 * Format days array for display
 * - Single day: "Mon"
 * - Two days: "Mon & Tue"
 * - Consecutive days: "Mon-Wed"
 * - Non-consecutive: "Mon, Wed & Fri"
 */
export function formatDays(days: string[]): string {
  if (days.length === 1) return days[0].substring(0, 3)
  if (days.length === 2) return `${days[0].substring(0, 3)} & ${days[1].substring(0, 3)}`
  
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
  const indexes = sortedDays.map(day => dayOrder.indexOf(day))
  
  // Check if days are consecutive
  const isConsecutive = indexes.every((index, i) => {
    if (i === 0) return true
    return index === indexes[i - 1] + 1
  })

  if (isConsecutive && sortedDays.length >= 3) {
    return `${sortedDays[0].substring(0, 3)}-${sortedDays[sortedDays.length - 1].substring(0, 3)}`
  }

  // For non-consecutive groups, list them out
  return sortedDays.map(day => day.substring(0, 3)).slice(0, -1).join(', ') + ' & ' + sortedDays[sortedDays.length - 1].substring(0, 3)
}

/**
 * Get amenities for a brewery
 */
export function getBreweryAmenities(brewery: any) {
  return [
    {
      key: 'is_pet_friendly',
      label: 'Pet Friendly',
      isAvailable: brewery.is_pet_friendly || false
    },
    {
      key: 'has_na_beer',
      label: 'Non-Alcoholic Options',
      isAvailable: brewery.has_na_beer || false
    },
    {
      key: 'has_outdoor_seating',
      label: 'Outdoor Seating',
      isAvailable: brewery.has_outdoor_seating || false
    },
    {
      key: 'has_food_trucks',
      label: 'Food Available',
      isAvailable: brewery.has_food_trucks || false
    },
    {
      key: 'has_wifi',
      label: 'Wifi Available',
      isAvailable: brewery.has_wifi || false
    }
  ]
}


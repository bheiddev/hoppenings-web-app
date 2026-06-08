import { FoodTruck } from '@/types/supabase'
import { getTodayMountainDateString, normalizeEventDateToMountainTime } from '@/lib/utils'

export function isDateSpecificFoodTruck(truck: FoodTruck): boolean {
  return truck.permanent !== true
}

export function getFoodTruckMountainDate(truck: FoodTruck): string | null {
  if (!truck.date?.trim()) return null
  return normalizeEventDateToMountainTime(truck.date)
}

export function isUpcomingFoodTruck(truck: FoodTruck): boolean {
  if (!isDateSpecificFoodTruck(truck)) return false
  const date = getFoodTruckMountainDate(truck)
  if (!date) return false
  return date >= getTodayMountainDateString()
}

export function sortFoodTrucksChronologically(a: FoodTruck, b: FoodTruck): number {
  const dateA = getFoodTruckMountainDate(a) ?? ''
  const dateB = getFoodTruckMountainDate(b) ?? ''
  if (dateA !== dateB) return dateA.localeCompare(dateB)
  return (a.name ?? '').localeCompare(b.name ?? '')
}

export function filterUpcomingFoodTrucks(trucks: FoodTruck[]): FoodTruck[] {
  return trucks.filter(isUpcomingFoodTruck).sort(sortFoodTrucksChronologically)
}

export function foodTruckShowsOnDate(truck: FoodTruck, ymd: string): boolean {
  if (!isDateSpecificFoodTruck(truck)) return false
  return getFoodTruckMountainDate(truck) === ymd
}

// Type definitions matching the mobile app
export interface Brewery {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  is_pet_friendly: boolean;
  has_outdoor_seating: boolean;
  has_food_trucks: boolean;
  has_wifi: boolean;
  has_na_beer: boolean;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  Region: string | null;
  tap_image: string | null;
}

export interface BreweryHours {
  id: string;
  brewery_id: string;
  monday_open: string | null;
  monday_close: string | null;
  tuesday_open: string | null;
  tuesday_close: string | null;
  wednesday_open: string | null;
  wednesday_close: string | null;
  thursday_open: string | null;
  thursday_close: string | null; 
  friday_open: string | null;
  friday_close: string | null;
  saturday_open: string | null;
  saturday_close: string | null;
  sunday_open: string | null;
  sunday_close: string | null;
}

export interface Event {
  id: string;
  created_at: string;
  title: string;
  brewery_id: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  cost: number | null;
  is_recurring: boolean;
  is_recurring_biweekly: boolean;
  is_recurring_monthly: boolean;
  recurrence_pattern?: string | null;
  description: string | null;
  featured: boolean;
  breweries: {
    id: string;
    name: string;
    location?: string | null;
    Region?: string | null;
    image_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

export interface BeerRelease {
  id: string;
  created_at: string;
  beer_name: string;
  ABV: string | null;
  Type: string | null;
  description: string | null;
  brewery_id: string;
  brewery_id2: string | null;
  brewery_id3: string | null;
  release_date: string | null;
  breweries: {
    id: string;
    name: string;
    location?: string | null;
    Region?: string | null;
  };
}

export interface ProposedEvent {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  brewery_id: string | null;
  event_date: string | null;
  start_time: string | null;
  brewery_id2: string | null;
  brewery_id3: string | null;
  cost: number | null;
  end_time: string | null;
  featured: boolean | null;
  is_recurring: boolean | null;
  is_recurring_biweekly: boolean | null;
  is_recurring_monthly: boolean | null;
}

/** Staging beer releases awaiting Content Admin accept/reject. */
export interface ProposedBeerRelease {
  id: number;
  created_at: string;
  beer_name: string | null;
  description: string | null;
  brewery_id: string | null;
  ABV: string | null;
  Type: string | null;
  release_date: string | null;
  brewery_id2: string | null;
  brewery_id3: string | null;
}

export interface FoodTruck {
  id: number;
  created_at: string;
  brewery_id: string | null;
  name: string | null;
  permanent: boolean | null;
  date: string | null;
  closed: number[] | null;
}

export type HappyHourDayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface HappyHourDeal {
  id: string;
  created_at: string;
  updated_at: string;
  brewery_id: string;
  day_of_week: HappyHourDayOfWeek;
  time_start: number | null;
  time_end: number | null;
  title: string;
  description: string | null;
}

export interface TaplistItem {
  brewery_id: string;
  beer_name: string;
  description: string | null;
  abv: string | null;
  type: string | null;
  is_active: boolean;
  first_seen: string | null;
  last_seen: string | null;
}

/** Shared with mobile — profiles.id = auth.users.id (created by handle_new_user trigger) */
export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  provider_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  staff_brewery_id: string | null;
  admin: boolean | null;
}

/** Client-writable profile fields only */
export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  staff_brewery_id?: string | null;
}


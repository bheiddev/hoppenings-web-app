// Type definitions matching the mobile app
export interface Brewery {
  id: string;
  created_at: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location: string | null;
  phone: string;
  description: string;
  is_pet_friendly: boolean;
  has_outdoor_seating: boolean;
  has_food_trucks: boolean;
  has_wifi: boolean;
  has_na_beer: boolean;
  image_url: string | null;
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
  };
}

export interface ProposedEvent {
  id: string;
  created_at: string;
  brewery_id: string;
  title: string | null;
  event_date: string | null;
  description: string | null;
}


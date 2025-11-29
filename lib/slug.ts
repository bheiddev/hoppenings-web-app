/**
 * Slug generation utilities for SEO-friendly URLs
 * Generates slugs dynamically from existing data without database storage
 */

/**
 * Core slug generation function
 * Converts text to URL-friendly slug format
 */
export function generateSlug(text: string, maxLength: number = 60): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
    .substring(0, maxLength);   // Limit length
}

/**
 * Format date for slug (e.g., "december-4-2025")
 */
export function formatDateForSlug(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Extract city from location string
 * "Colorado Springs, CO" -> "colorado-springs"
 */
export function extractCitySlug(location: string | null): string {
  if (!location) return '';
  const city = location.split(',')[0].trim();
  return generateSlug(city, 30);
}

/**
 * Generate event slug
 * Format: [title]-[brewery-name]-[location]-[date-if-recurring]-[uuid-suffix]
 */
export function generateEventSlug(
  title: string,
  breweryName: string,
  location: string | null,
  eventDate: string,
  eventId: string,
  isRecurring: boolean = false
): string {
  const titleSlug = generateSlug(title, 40);
  const brewerySlug = generateSlug(breweryName, 30);
  const locationSlug = extractCitySlug(location);
  const dateSlug = isRecurring ? formatDateForSlug(eventDate) : '';
  // Ensure eventId is a string before calling split
  const idString = String(eventId || '');
  const uuidSuffix = idString.split('-').pop()?.substring(0, 8) || '';

  // Build slug parts
  const parts = [titleSlug, brewerySlug];
  
  if (locationSlug) {
    parts.push(locationSlug);
  }
  
  if (dateSlug) {
    parts.push(dateSlug);
  }
  
  parts.push(uuidSuffix);

  return parts.filter(Boolean).join('-');
}

/**
 * Generate release slug
 * Format: [beer-name]-[type]-[brewery-name]-[location]-[uuid-suffix]
 */
export function generateReleaseSlug(
  beerName: string,
  beerType: string | null,
  breweryName: string,
  location: string | null,
  releaseId: string
): string {
  const beerSlug = generateSlug(beerName, 30);
  const typeSlug = beerType ? generateSlug(beerType, 20) : '';
  const brewerySlug = generateSlug(breweryName, 30);
  const locationSlug = extractCitySlug(location);
  // Ensure releaseId is a string before calling split
  const idString = String(releaseId || '');
  const uuidSuffix = idString.split('-').pop()?.substring(0, 8) || '';

  const parts = [beerSlug];
  
  if (typeSlug) {
    parts.push(typeSlug);
  }
  
  parts.push(brewerySlug);
  
  if (locationSlug) {
    parts.push(locationSlug);
  }
  
  parts.push(uuidSuffix);

  return parts.filter(Boolean).join('-');
}

/**
 * Generate brewery slug
 * Format: [name]-[location]-[uuid-suffix]
 */
export function generateBrewerySlug(
  name: string,
  location: string | null,
  breweryId: string
): string {
  const nameSlug = generateSlug(name, 40);
  const locationSlug = extractCitySlug(location);
  // Ensure breweryId is a string before calling split
  const idString = String(breweryId || '');
  const uuidSuffix = idString.split('-').pop()?.substring(0, 8) || '';

  const parts = [nameSlug];
  
  if (locationSlug) {
    parts.push(locationSlug);
  }
  
  parts.push(uuidSuffix);

  return parts.filter(Boolean).join('-');
}


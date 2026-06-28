/**
 * Color palette for Hoppenings web app
 * Matching the mobile app color scheme
 */
const TAN = '#FCCCA8'

export const Colors = {
  // Primary Brand Colors
  primary: '#F8C701',        // Gold/Yellow - main brand color
  primaryDark: '#4E1F00',    // Dark Brown - text on primary buttons
  
  // Background Colors
  background: '#5F2627',     // Dark Brown - main/global background
  surface: TAN,              // Tan - cards, inputs, banners
  surfaceMedium: '#5F2627',  // Dark Brown - page and header surfaces
  surfaceLight: TAN,         // Tan - table headers, pills, contact items
  surfaceDark: '#5F2627',    // Dark Brown - image placeholders, pill backgrounds
  backgroundDark: '#5F2627', // Dark Brown - dark backgrounds
  backgroundMedium: '#833D30', // Medium Brown - headers, cards
  backgroundLight: TAN,      // Tan - contact items, cache sections
  
  // Text Colors
  tan: TAN,                  // Brand tan - hop icon color
  textPrimary: TAN,          // Light text on dark backgrounds
  textSecondary: '#774141',  // Medium text color
  textDark: '#4E1F00',       // Dark text on light backgrounds
  textMuted: '#999',         // Muted text for unavailable items
  
  // UI Colors
  divider: '#5F2627',        // Main divider color
  dividerLight: TAN,         // Tan divider
  dividerWhite: TAN,           // Tan divider with opacity
  border: TAN,               // Border color
  
  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#FF9B01',           // Orange for icons/details
  
  // Map and UI Specific
  mapMarker: '#F8C701',      // Map marker color
  shadow: 'rgba(0, 0, 0, 0.25)', // Standard shadow
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Transparent overlays
  overlayDark: 'rgba(131, 61, 48, 0.8)', // Dark overlay for loading
  pillBackground: 'rgba(95, 38, 39, 0.75)', // Detail pill background
} as const;

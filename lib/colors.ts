/**
 * Color palette for Hoppenings web app
 * Matching the mobile app color scheme
 */
export const Colors = {
  // Primary Brand Colors
  primary: '#F8C701',        // Gold/Yellow - main brand color
  primaryDark: '#4E1F00',    // Dark Brown - text on primary buttons
  
  // Background Colors
  background: '#F8F4E1',     // Cream - main background
  backgroundDark: '#5F2627', // Dark Brown - dark backgrounds
  backgroundMedium: '#833D30', // Medium Brown - headers, cards
  backgroundLight: '#E0D5B8', // Light Brown - contact items, cache sections
  
  // Text Colors
  textPrimary: '#F8F4E1',    // Light text on dark backgrounds
  textSecondary: '#774141',  // Medium text color
  textDark: '#4E1F00',       // Dark text on light backgrounds
  textMuted: '#999',         // Muted text for unavailable items
  
  // UI Colors
  divider: '#5F2627',        // Main divider color
  dividerLight: '#E7BFA8',   // Light divider
  dividerWhite: '#F8F4E1',   // White divider with opacity
  border: '#F8F4E1',         // Border color
  
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


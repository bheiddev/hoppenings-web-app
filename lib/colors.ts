/**
 * Color palette for Hoppenings web app
 * Warm craft-brewery aesthetic from site design mockups
 */
export const Colors = {
  // Primary Brand Colors
  primary: '#5D2525',        // Maroon — CTAs, headings, accents
  primaryDark: '#3A1515',    // Darker maroon — heading emphasis on light surfaces
  onPrimary: '#FFFFFF',      // Text/icons on primary fills
  accent: '#F8C701',         // Brand gold — highlights, stars

  // Background Colors
  background: '#F9F7F2',     // Cream — main page background
  surface: '#FFFFFF',        // White — cards, inputs, modals
  surfaceMedium: '#F9F7F2',  // Cream — page surfaces
  surfaceLight: '#F2EEE9',   // Light beige — table headers, secondary surfaces
  surfaceDark: '#1A1A1A',    // Charcoal — dark pills, image placeholders
  backgroundDark: '#1A1A1A', // Charcoal — nav, footer, hero overlays
  backgroundMedium: '#5D2525', // Maroon — accent surfaces
  backgroundLight: '#F2EEE9',  // Light beige

  // Text Colors
  tan: '#F9F7F2',            // Cream (legacy name; light fill on dark)
  textPrimary: '#2D2926',    // Dark charcoal — body text on cream
  textSecondary: '#665E5A',  // Muted brown-gray
  textDark: '#2D2926',       // Dark text on light cards
  textMuted: '#999999',
  textOnDark: '#FFFFFF',     // Text on dark nav / footer / pills

  // UI Colors
  divider: '#E5DFD6',
  dividerLight: '#E5DFD6',
  dividerWhite: '#FFFFFF',
  border: '#E5DFD6',

  // Status Colors
  success: '#2D5A27',        // Forest green — OPEN NOW / NEW
  error: '#C62828',
  warning: '#D49B34',        // Amber
  info: '#D1811D',           // Orange accent

  // Map and UI Specific
  mapMarker: '#F8C701',
  shadow: 'rgba(0, 0, 0, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(26, 26, 26, 0.75)',
  pillBackground: 'rgba(93, 37, 37, 0.9)',
} as const;

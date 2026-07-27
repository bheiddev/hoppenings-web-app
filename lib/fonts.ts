/**
 * Font utilities for consistent typography
 * FjallaOne for headers, BeVietnamPro for body text
 */

import { Colors } from '@/lib/colors'

export const fontClasses = {
  heading: 'var(--font-fjalla-one)',
  body: 'var(--font-be-vietnam-pro)',
} as const

/**
 * Get font family style for headings (FjallaOne)
 */
export function getHeadingFontStyle(): React.CSSProperties {
  return {
    fontFamily: fontClasses.heading,
    color: Colors.primary,
    letterSpacing: '0.02em',
  }
}

/**
 * Get font family style for body text (BeVietnamPro)
 */
export function getBodyFontStyle(): React.CSSProperties {
  return {
    fontFamily: fontClasses.body,
  }
}

/**
 * Tailwind class for headings
 */
export const headingFontClass = '[font-family:var(--font-fjalla-one)]'

/**
 * Tailwind class for body text
 */
export const bodyFontClass = '[font-family:var(--font-be-vietnam-pro)]'


/**
 * Font style utilities for consistent typography
 * Use these constants to apply fonts consistently
 */

export const fontStyles = {
  heading: {
    fontFamily: 'var(--font-fjalla-one)',
  } as React.CSSProperties,
  
  body: {
    fontFamily: 'var(--font-be-vietnam-pro)',
  } as React.CSSProperties,
  
  // Helper to merge with existing styles
  headingStyle: (existingStyle?: React.CSSProperties) => ({
    ...existingStyle,
    fontFamily: 'var(--font-fjalla-one)',
  }),
  
  bodyStyle: (existingStyle?: React.CSSProperties) => ({
    ...existingStyle,
    fontFamily: 'var(--font-be-vietnam-pro)',
  }),
}


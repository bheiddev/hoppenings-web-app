import { ReactNode } from 'react'
import { getHeadingFontStyle, getBodyFontStyle } from '@/lib/fonts'

interface TypographyProps {
  children: ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption'
  className?: string
  style?: React.CSSProperties
}

export function Typography({ children, variant = 'body', className = '', style = {} }: TypographyProps) {
  const isHeading = variant.startsWith('h')
  const fontStyle = isHeading ? getHeadingFontStyle() : getBodyFontStyle()
  
  const baseStyles: React.CSSProperties = {
    ...fontStyle,
    ...style,
  }

  const Tag = variant === 'h1' ? 'h1' : 
              variant === 'h2' ? 'h2' : 
              variant === 'h3' ? 'h3' : 
              variant === 'h4' ? 'h4' : 
              variant === 'caption' ? 'span' : 'p'

  return (
    <Tag className={className} style={baseStyles}>
      {children}
    </Tag>
  )
}


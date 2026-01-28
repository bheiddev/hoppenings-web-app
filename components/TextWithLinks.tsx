import { convertUrlsToLinks } from '@/lib/utils'
import { Colors } from '@/lib/colors'

interface TextWithLinksProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Component that renders text with URLs converted to clickable links
 */
export function TextWithLinks({ text, className = '', style }: TextWithLinksProps) {
  const parts = convertUrlsToLinks(text)

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>
        } else {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 transition-opacity"
              style={{
                color: Colors.primary,
                ...style,
              }}
            >
              {part.text}
            </a>
          )
        }
      })}
    </>
  )
}

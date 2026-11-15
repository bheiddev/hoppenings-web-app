'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { Colors } from '@/lib/colors'

function pickImageFile(files: FileList | File[] | null): File | null {
  if (!files || files.length === 0) return null
  const file = files[0]
  if (!file.type.startsWith('image/')) return null
  return file
}

type ImageDropFieldProps = {
  label: string
  bucketHint: string
  file: File | null
  onFileChange: (file: File | null) => void
  /** Existing remote image shown until a new file is chosen. */
  existingSrc?: string | null
  disabled?: boolean
}

export function ImageDropField({
  label,
  bucketHint,
  file,
  onFileChange,
  existingSrc = null,
  disabled = false,
}: ImageDropFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const displaySrc = previewUrl || existingSrc || null

  function applyFile(next: File | null) {
    onFileChange(next)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="min-w-0 w-44 space-y-2">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: Colors.textSecondary }}
      >
        {label}
      </p>
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragging(false)
          if (disabled) return
          applyFile(pickImageFile(e.dataTransfer.files))
        }}
        className={`relative block w-full cursor-pointer overflow-hidden rounded-lg border border-dashed aspect-[2/3] transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        }`}
        style={{
          borderColor: dragging ? Colors.primary : Colors.dividerLight,
          backgroundColor: dragging ? Colors.surfaceLight : Colors.surfaceLight,
          boxShadow: dragging ? `0 0 0 2px ${Colors.primary}33` : undefined,
        }}
      >
        {displaySrc ? (
          previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview before upload
            <img src={displaySrc} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image
              src={displaySrc}
              alt={label}
              fill
              className="object-cover"
              sizes="176px"
              unoptimized
            />
          )
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-xs"
            style={{ color: Colors.textMuted }}
          >
            <span className="font-medium" style={{ color: Colors.textSecondary }}>
              Drop image here
            </span>
            <span>or click to browse</span>
          </div>
        )}
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => applyFile(pickImageFile(e.target.files))}
        />
      </label>
      <p className="text-[11px]" style={{ color: Colors.textMuted }}>
        Bucket <span className="font-mono">{bucketHint}</span>
      </p>
      {file ? (
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[11px]" style={{ color: Colors.textSecondary }}>
            {file.name}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => applyFile(null)}
            className="shrink-0 text-[11px] font-medium underline"
            style={{ color: Colors.textMuted }}
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}

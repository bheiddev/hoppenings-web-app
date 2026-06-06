'use client'

import { Colors } from '@/lib/colors'

export function AdminSpinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin flex-shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export type AdminButtonVariant = 'edit' | 'delete' | 'accept' | 'reject' | 'add' | 'cancel' | 'save'

const variantHoverClass: Record<AdminButtonVariant, string> = {
  edit: 'hover:enabled:bg-[#F8C701]/25',
  delete: 'hover:enabled:bg-[#F44336]/12',
  accept: 'hover:enabled:bg-[#4CAF50]/12',
  reject: 'hover:enabled:bg-[#F44336]/12',
  add: 'hover:enabled:brightness-95',
  cancel: 'hover:enabled:bg-[#E0D5B8]/70',
  save: 'hover:enabled:brightness-95',
}

function variantBorderColor(variant: AdminButtonVariant): string {
  switch (variant) {
    case 'edit':
      return Colors.primary
    case 'delete':
    case 'reject':
      return Colors.error
    case 'accept':
      return Colors.success
    case 'cancel':
      return Colors.dividerLight
    case 'add':
    case 'save':
      return 'transparent'
  }
}

export function AdminButton({
  variant,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = '',
}: {
  variant: AdminButtonVariant
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}) {
  const isCompact = variant !== 'cancel' && variant !== 'save'
  const filled = variant === 'add' || variant === 'save'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantHoverClass[variant]} ${
        isCompact ? 'px-2 py-1 text-xs rounded' : 'px-4 py-2 rounded font-medium'
      } ${className}`}
      style={{
        color: filled ? Colors.primaryDark : Colors.textDark,
        backgroundColor: filled ? Colors.primary : Colors.background,
        borderColor: variantBorderColor(variant),
      }}
    >
      {loading && <AdminSpinner />}
      {children}
    </button>
  )
}

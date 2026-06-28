'use client'

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

// Tailwind classes (not inline styles) so hover states can change background, text, and border.
const variantClass: Record<AdminButtonVariant, string> = {
  edit:
    'text-[#4E1F00] bg-[#FCCCA8] border-[#F8C701] hover:enabled:bg-[#F8C701]/30 hover:enabled:border-[#E6B800]',
  delete:
    'text-[#4E1F00] bg-[#FCCCA8] border-[#F44336] hover:enabled:bg-[#F44336]/15 hover:enabled:text-[#C62828] hover:enabled:border-[#D32F2F]',
  accept:
    'text-[#4E1F00] bg-[#FCCCA8] border-[#4CAF50] hover:enabled:bg-[#4CAF50]/15 hover:enabled:text-[#2E7D32] hover:enabled:border-[#43A047]',
  reject:
    'text-[#4E1F00] bg-[#FCCCA8] border-[#F44336] hover:enabled:bg-[#F44336]/15 hover:enabled:text-[#C62828] hover:enabled:border-[#D32F2F]',
  add: 'text-[#4E1F00] bg-[#F8C701] border-transparent hover:enabled:brightness-[0.92]',
  cancel:
    'text-[#4E1F00] bg-[#FCCCA8] border-[#FCCCA8] hover:enabled:bg-[#FCCCA8]/70 hover:enabled:border-[#E8B898]',
  save: 'text-[#4E1F00] bg-[#F8C701] border-transparent hover:enabled:brightness-[0.92]',
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
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1 border transition-colors duration-150 disabled:cursor-not-allowed ${
        isDisabled && !loading ? 'opacity-50' : ''
      } ${loading ? 'cursor-wait' : ''} ${variantClass[variant]} ${
        isCompact ? 'px-2 py-1 text-xs rounded' : 'px-4 py-2 rounded font-medium'
      } ${className}`}
    >
      {loading && <AdminSpinner className="h-3 w-3" />}
      {children}
    </button>
  )
}

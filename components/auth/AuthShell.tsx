'use client'

import Link from 'next/link'
import { Colors } from '@/lib/colors'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <main
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: Colors.surfaceMedium }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-6 sm:p-8 shadow-sm"
        style={{ backgroundColor: Colors.surface, borderColor: Colors.dividerLight }}
      >
        <h1
          className="text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-2"
          style={{ color: Colors.primary, fontFamily: 'var(--font-fjalla-one)' }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm mb-6" style={{ color: Colors.textSecondary }}>
            {subtitle}
          </p>
        ) : (
          <div className="mb-6" />
        )}
        {children}
      </div>
    </main>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      className="mb-4 px-3 py-2 rounded text-sm"
      style={{ backgroundColor: '#FEE2E2', color: Colors.error }}
      role="alert"
    >
      {message}
    </div>
  )
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      className="mb-4 px-3 py-2 rounded text-sm"
      style={{ backgroundColor: '#E8F5E9', color: Colors.success }}
      role="status"
    >
      {message}
    </div>
  )
}

export function AuthField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border rounded ${props.className ?? ''}`}
      style={{ ...inputStyle, ...props.style }}
    />
  )
}

export function AuthPrimaryButton({
  children,
  loading,
  type = 'submit',
  className = '',
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      className={`w-full btn-primary py-3 disabled:opacity-60 ${className}`}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export function AuthSecondaryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-sm underline underline-offset-2"
      style={{ color: Colors.primary }}
    >
      {children}
    </Link>
  )
}

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ backgroundColor: Colors.dividerLight }} />
      <span className="text-xs uppercase tracking-wide" style={{ color: Colors.textMuted }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: Colors.dividerLight }} />
    </div>
  )
}

export function OAuthButtons({
  onGoogle,
  onApple,
  disabled,
}: {
  onGoogle: () => void
  onApple: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onGoogle}
        disabled={disabled}
        className="w-full py-2.5 px-4 rounded border text-sm font-medium disabled:opacity-60"
        style={{
          borderColor: Colors.dividerLight,
          color: Colors.textDark,
          backgroundColor: Colors.surface,
        }}
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={onApple}
        disabled={disabled}
        className="w-full py-2.5 px-4 rounded border text-sm font-medium disabled:opacity-60"
        style={{
          borderColor: Colors.dividerLight,
          color: Colors.textOnDark,
          backgroundColor: Colors.backgroundDark,
        }}
      >
        Continue with Apple
      </button>
    </div>
  )
}

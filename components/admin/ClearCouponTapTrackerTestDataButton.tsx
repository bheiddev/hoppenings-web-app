'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { clearCouponAndTapTrackerTestData } from '@/app/admin/actions'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { Colors } from '@/lib/colors'

type Props = {
  couponsAwarded: number
  couponsRedeemed: number
  tapTrackerRuns: number
  enrollments: number
}

export function ClearCouponTapTrackerTestDataButton({
  couponsAwarded,
  couponsRedeemed,
  tapTrackerRuns,
  enrollments,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const total =
    couponsAwarded + tapTrackerRuns + enrollments

  if (total <= 0 && !lastResult) return null

  return (
    <div
      className="rounded-lg border px-4 py-3 space-y-2"
      style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: Colors.primaryDark, fontFamily: 'var(--font-be-vietnam-pro)' }}
          >
            Clear test usage data
          </p>
          <p className="text-xs mt-0.5" style={{ color: Colors.textSecondary }}>
            Deletes all coupon awards/redemptions ({couponsAwarded.toLocaleString()}
            {couponsRedeemed > 0 ? `, ${couponsRedeemed.toLocaleString()} redeemed` : ''}
            ), tap tracker runs ({tapTrackerRuns.toLocaleString()}), and enrollments (
            {enrollments.toLocaleString()}). Keeps offer catalog and brewery programs.
          </p>
        </div>
        <AdminButton
          variant="delete"
          loading={pending}
          disabled={pending || total <= 0}
          onClick={() => {
            const confirmed = window.confirm(
              `Delete ALL test coupon + tap tracker usage?\n\n` +
                `• ${couponsAwarded} coupon award(s)\n` +
                `• ${tapTrackerRuns} tap tracker run(s)\n` +
                `• ${enrollments} enrollment(s)\n\n` +
                `Offer catalog and programs are kept. This cannot be undone.`
            )
            if (!confirmed) return

            setError(null)
            setLastResult(null)
            startTransition(async () => {
              const result = await clearCouponAndTapTrackerTestData()
              if (!result.ok) {
                setError(result.error ?? 'Clear failed')
                return
              }
              const d = result.deleted
              setLastResult(
                d
                  ? `Cleared ${d.userCoupons} coupons, ${d.pourContestRuns} runs, ${d.enrollments} enrollments` +
                      (d.visitClaims || d.redeemSessions || d.guestClaims
                        ? ` (+ ${d.visitClaims} visit claims, ${d.redeemSessions} redeem sessions, ${d.guestClaims} guest claims)`
                        : '')
                      + '.'
                  : 'Cleared.'
              )
              router.refresh()
            })
          }}
        >
          {pending ? 'Clearing…' : 'Delete all usage'}
        </AdminButton>
      </div>
      {error ? (
        <p className="text-sm" style={{ color: Colors.error }}>
          {error}
        </p>
      ) : null}
      {lastResult ? (
        <p className="text-sm" style={{ color: Colors.success }}>
          {lastResult}
        </p>
      ) : null}
    </div>
  )
}

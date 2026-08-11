'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { updateBrewery, upsertBreweryHours, type BreweryHoursPayload } from '@/app/admin/actions'
import { formatDays, formatTime, groupHours, getBreweryAmenities } from '@/lib/breweryUtils'
import type { Brewery, BreweryHours } from '@/types/supabase'

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

type DayKey = (typeof DAYS)[number]

function timeForInput(raw: string | null | undefined): string {
  if (!raw) return ''
  const m = String(raw).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  return `${String(m[1]).padStart(2, '0')}:${m[2]}`
}

function ImagePreview({
  src,
  label,
}: {
  src: string | null
  label: string
}) {
  return (
    <div className="min-w-0 w-40">
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: Colors.textSecondary }}
      >
        {label}
      </p>
      {src ? (
        <div
          className="relative w-full overflow-hidden border rounded-lg aspect-[2/3]"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
        >
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover"
            sizes="160px"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center border rounded-lg text-sm aspect-[2/3]"
          style={{
            borderColor: Colors.dividerLight,
            backgroundColor: Colors.surfaceLight,
            color: Colors.textMuted,
          }}
        >
          No image
        </div>
      )}
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: Colors.textDark }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  )
}

function BrewerySettingsModal({
  brewery,
  hours,
  onClose,
  onSaved,
}: {
  brewery: Brewery
  hours: BreweryHours | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(brewery.name)
  const [address, setAddress] = useState(brewery.address)
  const [phone, setPhone] = useState(brewery.phone)
  const [description, setDescription] = useState(brewery.description)
  const [location, setLocation] = useState(brewery.location ?? brewery.Region ?? '')
  const [region, setRegion] = useState(brewery.Region ?? '')
  const [latitude, setLatitude] = useState(
    brewery.latitude != null ? String(brewery.latitude) : ''
  )
  const [longitude, setLongitude] = useState(
    brewery.longitude != null ? String(brewery.longitude) : ''
  )
  const [isPetFriendly, setIsPetFriendly] = useState(Boolean(brewery.is_pet_friendly))
  const [hasOutdoorSeating, setHasOutdoorSeating] = useState(Boolean(brewery.has_outdoor_seating))
  const [hasFoodTrucks, setHasFoodTrucks] = useState(Boolean(brewery.has_food_trucks))
  const [hasWifi, setHasWifi] = useState(Boolean(brewery.has_wifi))
  const [hasNaBeer, setHasNaBeer] = useState(Boolean(brewery.has_na_beer))
  const [breweryImage, setBreweryImage] = useState<File | null>(null)
  const [tapImage, setTapImage] = useState<File | null>(null)
  const [dayHours, setDayHours] = useState<Record<DayKey, { open: string; close: string }>>(() => {
    const initial = {} as Record<DayKey, { open: string; close: string }>
    for (const day of DAYS) {
      initial[day] = {
        open: timeForInput(hours?.[`${day}_open` as keyof BreweryHours] as string | null),
        close: timeForInput(hours?.[`${day}_close` as keyof BreweryHours] as string | null),
      }
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDayField(day: DayKey, field: 'open' | 'close', value: string) {
    setDayHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const formData = new FormData()
      formData.set('brewery_id', brewery.id)
      formData.set('name', name)
      formData.set('address', address)
      formData.set('phone', phone)
      formData.set('description', description)
      formData.set('region', region)
      formData.set('location', location)
      formData.set('latitude', latitude)
      formData.set('longitude', longitude)
      formData.set('is_pet_friendly', String(isPetFriendly))
      formData.set('has_outdoor_seating', String(hasOutdoorSeating))
      formData.set('has_food_trucks', String(hasFoodTrucks))
      formData.set('has_wifi', String(hasWifi))
      formData.set('has_na_beer', String(hasNaBeer))
      if (breweryImage) formData.set('brewery_image', breweryImage)
      if (tapImage) formData.set('tap_image', tapImage)

      const detailsResult = await updateBrewery(formData)
      if (!detailsResult?.ok) {
        setError(detailsResult?.error ?? 'Failed to update brewery')
        return
      }

      const hoursPayload = {} as BreweryHoursPayload
      for (const day of DAYS) {
        hoursPayload[`${day}_open`] = dayHours[day].open || null
        hoursPayload[`${day}_close`] = dayHours[day].close || null
      }

      const hoursResult = await upsertBreweryHours(brewery.id, hoursPayload)
      if (!hoursResult?.ok) {
        setError(hoursResult?.error ?? 'Details saved, but hours failed to update')
        return
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brewery')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: Colors.overlay }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6"
        style={{ backgroundColor: Colors.surface }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Edit brewery
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-3">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: Colors.textSecondary }}
            >
              Details
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                Phone
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                  Region
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                  Location label
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                  Latitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
                  Longitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <CheckboxField label="Pet friendly" checked={isPetFriendly} onChange={setIsPetFriendly} />
              <CheckboxField
                label="Outdoor seating"
                checked={hasOutdoorSeating}
                onChange={setHasOutdoorSeating}
              />
              <CheckboxField label="Food trucks" checked={hasFoodTrucks} onChange={setHasFoodTrucks} />
              <CheckboxField label="Wifi" checked={hasWifi} onChange={setHasWifi} />
              <CheckboxField label="NA beer" checked={hasNaBeer} onChange={setHasNaBeer} />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <ImagePreview src={brewery.image_url} label="Brewery image" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBreweryImage(e.target.files?.[0] ?? null)}
                  className="block w-40 text-sm"
                  style={{ color: Colors.textDark }}
                />
              </div>
              <div className="space-y-2">
                <ImagePreview src={brewery.tap_image} label="Tap list image" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTapImage(e.target.files?.[0] ?? null)}
                  className="block w-40 text-sm"
                  style={{ color: Colors.textDark }}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: Colors.textSecondary }}
            >
              Hours
            </p>
            <p className="text-xs" style={{ color: Colors.textMuted }}>
              Leave open/close blank for closed days.
            </p>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="grid grid-cols-[6.5rem_1fr_1fr] gap-2 items-center"
                >
                  <span className="text-sm capitalize" style={{ color: Colors.textDark }}>
                    {day}
                  </span>
                  <input
                    type="time"
                    value={dayHours[day].open}
                    onChange={(e) => setDayField(day, 'open', e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    style={inputStyle}
                    aria-label={`${day} open`}
                  />
                  <input
                    type="time"
                    value={dayHours[day].close}
                    onChange={(e) => setDayField(day, 'close', e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    style={inputStyle}
                    aria-label={`${day} close`}
                  />
                </div>
              ))}
            </div>
          </section>

          {error ? (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="cancel" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton variant="save" type="submit" loading={saving}>
              Save brewery
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export function BreweryAdminDetails({
  brewery,
  hours,
}: {
  brewery: Brewery
  hours: BreweryHours | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const amenities = getBreweryAmenities(brewery).filter((a) => a.isAvailable)
  const hourGroups = hours ? groupHours(hours) : []

  return (
    <>
      <div
        className="border rounded-lg p-4 space-y-3"
        style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surface }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm" style={{ color: Colors.textDark }}>
              <span style={{ color: Colors.textSecondary }}>Address · </span>
              {brewery.address}
            </p>
            <p className="text-sm" style={{ color: Colors.textDark }}>
              <span style={{ color: Colors.textSecondary }}>Phone · </span>
              {brewery.phone}
            </p>
            {brewery.Region ? (
              <p className="text-sm" style={{ color: Colors.textDark }}>
                <span style={{ color: Colors.textSecondary }}>Region · </span>
                {brewery.Region}
              </p>
            ) : null}
            {brewery.latitude != null && brewery.longitude != null ? (
              <p className="text-sm tabular-nums" style={{ color: Colors.textDark }}>
                <span style={{ color: Colors.textSecondary }}>Coords · </span>
                {brewery.latitude}, {brewery.longitude}
              </p>
            ) : null}
          </div>
          <AdminButton variant="edit" onClick={() => setEditing(true)}>
            Edit details & hours
          </AdminButton>
        </div>

        <div className="flex flex-wrap gap-4">
          <ImagePreview src={brewery.image_url} label="Brewery image" />
          <ImagePreview src={brewery.tap_image} label="Tap list image" />
        </div>

        {brewery.description ? (
          <p className="text-sm leading-relaxed" style={{ color: Colors.textSecondary }}>
            {brewery.description}
          </p>
        ) : null}

        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <span
                key={a.key}
                className="text-xs px-2 py-1 border"
                style={{
                  borderColor: Colors.dividerLight,
                  color: Colors.textDark,
                  backgroundColor: Colors.surfaceLight,
                }}
              >
                {a.label}
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: Colors.textSecondary }}
          >
            Hours
          </p>
          {hourGroups.length === 0 ? (
            <p className="text-sm" style={{ color: Colors.textMuted }}>
              No hours set yet.
            </p>
          ) : (
            <ul className="text-sm space-y-0.5" style={{ color: Colors.textDark }}>
              {hourGroups.map((group) => (
                <li key={group.days.join('-')}>
                  <span style={{ color: Colors.textSecondary }}>{formatDays(group.days)} · </span>
                  {group.open || group.close
                    ? `${formatTime(group.open)} – ${formatTime(group.close)}`
                    : 'Closed'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing ? (
        <BrewerySettingsModal
          brewery={brewery}
          hours={hours}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}

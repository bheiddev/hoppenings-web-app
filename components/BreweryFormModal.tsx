'use client'

import { useEffect, useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { createBrewery, upsertBreweryHours, type BreweryHoursPayload } from '@/app/admin/actions'

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

function FilePreview({ file, label }: { file: File | null; label: string }) {
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

  return (
    <div className="min-w-0 w-40 space-y-2">
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: Colors.textSecondary }}
      >
        {label}
      </p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview before upload
        <img
          src={previewUrl}
          alt={label}
          className="w-full rounded-lg border object-cover aspect-[2/3]"
          style={{ borderColor: Colors.dividerLight, backgroundColor: Colors.surfaceLight }}
        />
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

function emptyDayHours(): Record<DayKey, { open: string; close: string }> {
  const initial = {} as Record<DayKey, { open: string; close: string }>
  for (const day of DAYS) {
    initial[day] = { open: '', close: '' }
  }
  return initial
}

export function BreweryFormModal({
  regionLabel,
  onClose,
  onCreated,
}: {
  regionLabel: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState(regionLabel)
  const [location, setLocation] = useState(regionLabel)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [isPetFriendly, setIsPetFriendly] = useState(false)
  const [hasOutdoorSeating, setHasOutdoorSeating] = useState(false)
  const [hasFoodTrucks, setHasFoodTrucks] = useState(false)
  const [hasWifi, setHasWifi] = useState(false)
  const [hasNaBeer, setHasNaBeer] = useState(false)
  const [breweryImage, setBreweryImage] = useState<File | null>(null)
  const [tapImage, setTapImage] = useState<File | null>(null)
  const [dayHours, setDayHours] = useState(emptyDayHours)
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

      const result = await createBrewery(formData)
      if (!result?.ok || !('id' in result) || !result.id) {
        setError(result?.error ?? 'Failed to create brewery')
        return
      }

      const hoursPayload = {} as BreweryHoursPayload
      for (const day of DAYS) {
        hoursPayload[`${day}_open`] = dayHours[day].open || null
        hoursPayload[`${day}_close`] = dayHours[day].close || null
      }

      const hoursResult = await upsertBreweryHours(result.id, hoursPayload)
      if (!hoursResult?.ok) {
        setError(hoursResult?.error ?? 'Brewery created, but hours failed to save')
        return
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brewery')
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
          className="text-xl font-bold mb-1"
          style={{ color: Colors.textDark, fontFamily: 'var(--font-fjalla-one)' }}
        >
          Add brewery
        </h3>
        <p className="text-xs mb-4" style={{ color: Colors.textMuted }}>
          Creates a new row in <span className="font-mono">breweries</span>, optional hours, and
          image uploads to storage.
        </p>

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
                  required
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
              <CheckboxField
                label="Pet friendly"
                checked={isPetFriendly}
                onChange={setIsPetFriendly}
              />
              <CheckboxField
                label="Outdoor seating"
                checked={hasOutdoorSeating}
                onChange={setHasOutdoorSeating}
              />
              <CheckboxField
                label="Food trucks"
                checked={hasFoodTrucks}
                onChange={setHasFoodTrucks}
              />
              <CheckboxField label="Wifi" checked={hasWifi} onChange={setHasWifi} />
              <CheckboxField label="NA beer" checked={hasNaBeer} onChange={setHasNaBeer} />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <FilePreview file={breweryImage} label="Brewery image" />
                <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                  Bucket <span className="font-mono">brewery-images</span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBreweryImage(e.target.files?.[0] ?? null)}
                  className="block w-40 text-sm"
                  style={{ color: Colors.textDark }}
                />
              </div>
              <div className="space-y-2">
                <FilePreview file={tapImage} label="Tap list image" />
                <p className="text-[11px]" style={{ color: Colors.textMuted }}>
                  Bucket <span className="font-mono">Tap Images</span>
                </p>
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
              Create brewery
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}

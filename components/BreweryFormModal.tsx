'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import {
  BREWERY_DAYS,
  BreweryHoursFields,
  type BreweryDayHours,
  type BreweryDayKey,
} from '@/components/BreweryHoursFields'
import { ImageDropField } from '@/components/ImageDropField'
import { createBrewery, upsertBreweryHours, type BreweryHoursPayload } from '@/app/admin/actions'

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

function emptyDayHours(): BreweryDayHours {
  const initial = {} as BreweryDayHours
  for (const day of BREWERY_DAYS) {
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
  const [instagram, setInstagram] = useState('')
  const [region, setRegion] = useState(regionLabel)
  const [location, setLocation] = useState(regionLabel)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [breweryImage, setBreweryImage] = useState<File | null>(null)
  const [dayHours, setDayHours] = useState(emptyDayHours)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDayField(day: BreweryDayKey, field: 'open' | 'close', value: string) {
    setDayHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function copyHoursFromPreviousDay(day: BreweryDayKey) {
    const index = BREWERY_DAYS.indexOf(day)
    if (index <= 0) return
    const previousDay = BREWERY_DAYS[index - 1]
    setDayHours((prev) => ({
      ...prev,
      [day]: { open: prev[previousDay].open, close: prev[previousDay].close },
    }))
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
      formData.set('instagram', instagram)
      formData.set('region', region)
      formData.set('location', location)
      formData.set('latitude', latitude)
      formData.set('longitude', longitude)
      if (breweryImage) formData.set('brewery_image', breweryImage)

      const result = await createBrewery(formData)
      if (!result?.ok || !('id' in result) || !result.id) {
        setError(result?.error ?? 'Failed to create brewery')
        return
      }

      const hoursPayload = {} as BreweryHoursPayload
      for (const day of BREWERY_DAYS) {
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
      role="presentation"
    >
      <div
        className="relative rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6"
        style={{ backgroundColor: Colors.surface }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-brewery-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded border text-lg leading-none transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            borderColor: Colors.dividerLight,
            color: Colors.textDark,
            backgroundColor: Colors.surfaceLight,
          }}
        >
          ×
        </button>

        <h3
          id="add-brewery-title"
          className="text-xl font-bold mb-1 pr-10"
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
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle or https://instagram.com/…"
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
            <div className="flex flex-wrap gap-4">
              <ImageDropField
                label="Brewery image"
                bucketHint="brewery-images"
                file={breweryImage}
                onFileChange={setBreweryImage}
                disabled={saving}
              />
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
              Leave open/close blank for closed days. Use Copy to match the previous day.
            </p>
            <BreweryHoursFields
              dayHours={dayHours}
              onChange={setDayField}
              onCopyFromPrevious={copyHoursFromPreviousDay}
              disabled={saving}
            />
          </section>

          {error ? (
            <p className="text-sm" style={{ color: Colors.error }}>
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="save" type="submit" loading={saving}>
              Create brewery
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  )
}

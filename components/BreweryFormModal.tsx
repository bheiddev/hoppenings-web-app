'use client'

import { useState } from 'react'
import { Colors } from '@/lib/colors'
import { AdminButton } from '@/components/breweriesEventsAdminButtons'
import { createBrewery } from '@/app/admin/actions'

const inputStyle = {
  borderColor: Colors.dividerLight,
  color: Colors.textDark,
  backgroundColor: Colors.surface,
} as const

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      formData.set('region', regionLabel)
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
      if (!result?.ok) {
        setError(result?.error ?? 'Failed to create brewery')
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
        className="rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-auto p-6"
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
          Region: {regionLabel}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Brewery image
            </label>
            <p className="text-xs mb-1" style={{ color: Colors.textMuted }}>
              Uploads to storage bucket <span className="font-mono">brewery-images</span>
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBreweryImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
              style={{ color: Colors.textDark }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: Colors.textDark }}>
              Tap list image
            </label>
            <p className="text-xs mb-1" style={{ color: Colors.textMuted }}>
              Uploads to storage bucket <span className="font-mono">Tap Images</span>
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setTapImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
              style={{ color: Colors.textDark }}
            />
          </div>

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

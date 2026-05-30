import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type BookingErrorType = 'network' | 'server' | 'not_found' | 'generic' | null

export function useBookingData(slug: string) {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  
  // Page-level error (blocks entire booking, shows full-page error)
  const [errorType, setErrorType] = useState<BookingErrorType>(null)
  // Step-level error (shows inline, e.g. slots failed to load)
  const [slotsError, setSlotsError] = useState<BookingErrorType>(null)

  // Auto-skip location if only one
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  const loadTenantData = useCallback(async () => {
    setLoading(true)
    setErrorType(null)

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (tenantError) {
        if (tenantError.code === 'PGRST116' || tenantError.code === '404' || tenantError.message?.includes('not found')) {
          setErrorType('not_found')
        } else if (tenantError.message?.includes('Failed to fetch') || tenantError.message?.includes('NetworkError')) {
          setErrorType('network')
        } else {
          setErrorType('server')
        }
        setLoading(false)
        return
      }

      if (!tenantData) {
        setErrorType('not_found')
        setLoading(false)
        return
      }

      setTenant(tenantData)

      const [locs, servs, pros] = await Promise.all([
        supabase.from('locations').select('*').eq('tenant_id', tenantData.id).eq('active', true),
        supabase.from('services').select('*').eq('tenant_id', tenantData.id).eq('active', true),
        supabase.from('professionals').select('*').eq('tenant_id', tenantData.id).eq('active', true)
      ])

      setLocations(locs.data || [])
      setServices(servs.data || [])
      setProfessionals(pros.data || [])

      // Auto-skip location step if only one location
      if (locs.data?.length === 1) {
        setSelectedLocation(locs.data[0])
      }
    } catch (err: any) {
      console.error('[booking loadTenantData]', err)
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
        setErrorType('network')
      } else {
        setErrorType('generic')
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadTenantData()
  }, [loadTenantData])

  const fetchSlots = useCallback(async (
    tenantId: string,
    professionalId: string,
    serviceId: string,
    dateStr: string
  ) => {
    const params = new URLSearchParams({
      tenant_id: tenantId,
      professional_id: professionalId,
      date: dateStr,
      service_id: serviceId,
    })

    try {
      setSlotsError(null)
      const res = await fetch(`/api/appointments/available-slots?${params}`)
      if (!res.ok) {
        setSlotsError('server')
        setAvailableSlots([])
        return
      }
      const data = await res.json()
      setAvailableSlots(data.slots || [])
      setIsBlocked(data.isBlocked || false)
      setBlockReason(data.blockReason || null)
    } catch (e: any) {
      console.error('[booking fetchSlots]', e)
      if (e?.message?.includes('Failed to fetch') || e?.name === 'TypeError') {
        setSlotsError('network')
      } else {
        setSlotsError('server')
      }
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
    }
  }, [])

  const handleBooking = async (bookingData: {
    tenantId: string
    professionalId: string
    serviceId: string
    locationId: string | null
    startAt: string
    endAt: string
    firstName: string
    lastName: string
    email: string
    phone: string
    notes: string
  }) => {
    const response = await fetch('/api/appointments/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: bookingData.tenantId,
        professional_id: bookingData.professionalId,
        service_id: bookingData.serviceId,
        location_id: bookingData.locationId,
        start_at: bookingData.startAt,
        end_at: bookingData.endAt,
        notes: bookingData.notes,
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to book appointment')
    }

    return true
  }

  const retry = useCallback(() => {
    setErrorType(null)
    loadTenantData()
  }, [loadTenantData])

  const retrySlots = useCallback(async (tenantId: string, professionalId: string, serviceId: string, dateStr: string) => {
    await fetchSlots(tenantId, professionalId, serviceId, dateStr)
  }, [fetchSlots])

  return {
    loading,
    tenant,
    locations,
    services,
    professionals,
    availableSlots,
    isBlocked,
    blockReason,
    selectedLocation,
    setSelectedLocation,
    errorType,
    slotsError,
    fetchSlots,
    handleBooking,
    retry,
    retrySlots
  }
}
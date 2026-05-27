"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LimitInfo {
  resource: 'professionals' | 'locations' | 'appointments' | 'patients' | 'services'
  current: number
  max: number
  allowed: boolean
  loading: boolean
}

export function usePlanLimits(tenantId: string) {
  const [limits, setLimits] = useState<Record<string, LimitInfo>>({
    professionals: { resource: 'professionals', current: 0, max: -1, allowed: true, loading: true },
    locations: { resource: 'locations', current: 0, max: -1, allowed: true, loading: true },
    appointments: { resource: 'appointments', current: 0, max: -1, allowed: true, loading: true },
    patients: { resource: 'patients', current: 0, max: -1, allowed: true, loading: true },
  })
  const [loading, setLoading] = useState(true)

  const fetchLimits = useCallback(async () => {
    if (!tenantId) return

    const supabase = createClient()

    // Get tenant limits
    const { data: tenant } = await supabase
      .from('tenants')
      .select('max_professionals, max_locations, max_appointments_per_month, max_patients')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    // Fetch counts in parallel
    const [profCount, locCount, patientCount] = await Promise.all([
      supabase.from('professionals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('locations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])

    // Get current month appointments
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const { count: apptCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_at', startOfMonth)
      .lte('start_at', endOfMonth)

    const newLimits = {
      professionals: {
        resource: 'professionals' as const,
        current: profCount.count ?? 0,
        max: tenant.max_professionals ?? -1,
        allowed: (profCount.count ?? 0) < (tenant.max_professionals ?? -1) || tenant.max_professionals === -1,
        loading: false
      },
      locations: {
        resource: 'locations' as const,
        current: locCount.count ?? 0,
        max: tenant.max_locations ?? -1,
        allowed: (locCount.count ?? 0) < (tenant.max_locations ?? -1) || tenant.max_locations === -1,
        loading: false
      },
      appointments: {
        resource: 'appointments' as const,
        current: apptCount ?? 0,
        max: tenant.max_appointments_per_month ?? -1,
        allowed: (apptCount ?? 0) < (tenant.max_appointments_per_month ?? -1) || tenant.max_appointments_per_month === -1,
        loading: false
      },
      patients: {
        resource: 'patients' as const,
        current: patientCount.count ?? 0,
        max: tenant.max_patients ?? -1,
        allowed: (patientCount.count ?? 0) < (tenant.max_patients ?? -1) || tenant.max_patients === -1,
        loading: false
      },
    }

    setLimits(newLimits)
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  const canAddProfessional = limits.professionals.allowed
  const canAddLocation = limits.locations.allowed
  const canAddAppointment = limits.appointments.allowed
  const canAddPatient = limits.patients.allowed

  return {
    limits,
    loading,
    refetch: fetchLimits,
    canAddProfessional,
    canAddLocation,
    canAddAppointment,
    canAddPatient,
  }
}
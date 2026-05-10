"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

export interface Appointment {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  notes?: string;
  cancellation_reason?: string;
  cancellation_notified?: boolean;
  location_id?: string | null;
  rescheduled_from_appointment_id?: string;
  clients: { id: string; first_name: string; last_name: string; phone: string } | null;
  services: { name: string } | null;
  professionals: { id: string; full_name: string } | null;
  last_visits?: { service_name: string; date: string }[];
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

// Simple in-memory cache to store data during the session
const appointmentsCache: {
  meta: { services: any[]; professionals: any[] } | null;
  days: Record<string, any[]>;
  months: Record<string, any[]>;
} = {
  meta: null,
  days: {},
  months: {},
};

export function useAppointments() {
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allMonthApps, setAllMonthApps] = useState<Appointment[]>([])
  const [tenantId, setTenantId] = useState<string>('')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotLoading, setSlotLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [pendingCalls, setPendingCalls] = useState<Appointment[]>([])
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [loading, setLoading] = useState(true)
  const lastSlotParams = useRef<{p: string, d: string, s?: string} | null>(null)

  const fetchMeta = useCallback(async (tenantId: string, locId?: string | null) => {
    if (appointmentsCache.meta) {
      setServices(appointmentsCache.meta.services);
      setProfessionals(appointmentsCache.meta.professionals);
      return;
    }

    const { data: s } = await supabase.from('services').select('id, name').eq('tenant_id', tenantId).eq('active', true)
    let profQuery = supabase.from('professionals').select('id, full_name').eq('tenant_id', tenantId).eq('active', true)
    if (locId) {
      profQuery = profQuery.eq('location_id', locId)
    }
    const { data: p } = await profQuery
    
    if (s && p) {
      const meta = { services: s, professionals: p };
      appointmentsCache.meta = meta;
      setServices(s)
      setProfessionals(p)
    }
  }, [supabase])

  const fetchMonthAppointments = useCallback(async (tenantId: string, month: Date, locId?: string | null, force = false) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    const cacheKey = `${tenantId}-${locId || 'all'}-${start}-${end}`;

    if (!force && appointmentsCache.months[cacheKey]) {
      setAllMonthApps(appointmentsCache.months[cacheKey]);
      return;
    }

    let query = supabase.from('appointments').select('*, clients(*), services(*), professionals(*)')
      .eq('tenant_id', tenantId).neq('status', 'cancelled')
      .gte('start_at', `${start}T00:00:00Z`).lte('start_at', `${end}T23:59:59Z`)
    
    if (locId) {
      query = query.eq('location_id', locId)
    }
    
    const { data } = await query
    
    if (data) {
      appointmentsCache.months[cacheKey] = data;
      setAllMonthApps(data as any[])
    }

    let pendingQuery = supabase.from('appointments')
      .select('*, clients(*), services(*), professionals(*)')
      .eq('tenant_id', tenantId)
      .eq('status', 'cancelled')
      .eq('cancellation_reason', 'professional_cancellation')
      .eq('cancellation_notified', false)
      .order('start_at', { ascending: true })
    
    if (locId) {
      pendingQuery = pendingQuery.eq('location_id', locId)
    }
    
    const { data: pending } = await pendingQuery
    if (pending) setPendingCalls(pending as any[])
  }, [supabase])

  const fetchDayAppointments = useCallback(async (tenantId: string, date: Date, locId?: string | null, force = false) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const cacheKey = `${tenantId}-${locId || 'all'}-${dateStr}`;

    if (!force && appointmentsCache.days[cacheKey]) {
      setAppointments(appointmentsCache.days[cacheKey]);
      return;
    }

    let query = supabase.from('appointments')
      .select('*, clients(*), services(*), professionals(*)')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled","rescheduled")')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)
      .order('start_at', { ascending: true })
    
    if (locId) {
      query = query.eq('location_id', locId)
    }
    
    const { data } = await query
    
    if (data) {
      appointmentsCache.days[cacheKey] = data;
      setAppointments(data as any[])
    }
  }, [supabase])

  const fetchSlots = useCallback(async (profId: string, dateStr: string, serviceId?: string) => {
    if (!profId || !tenantId || !dateStr) {
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
      return
    }
    setSlotLoading(true)
    lastSlotParams.current = { p: profId, d: dateStr, s: serviceId }
    try {
      const queryParams: any = { 
        tenant_id: tenantId, 
        professional_id: profId, 
        date: dateStr 
      }
      if (serviceId) queryParams.service_id = serviceId
      
      const params = new URLSearchParams(queryParams)
      const res = await fetch(`/api/appointments/available-slots?${params}`)
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data: { slots: string[]; isBlocked: boolean; blockReason: string | null } = await res.json()
      setAvailableSlots(data.slots)
      setIsBlocked(data.isBlocked)
      setBlockReason(data.blockReason)
    } catch (e) {
      console.error('[fetchSlots]', e)
      setAvailableSlots([])
      setIsBlocked(false)
      setBlockReason(null)
    } finally {
      setSlotLoading(false)
    }
  }, [tenantId])

  const refresh = useCallback(() => {
    if (tenantId) {
      appointmentsCache.days = {};
      appointmentsCache.months = {};
      fetchDayAppointments(tenantId, selectedDate, locationId, true)
      fetchMonthAppointments(tenantId, currentMonth, locationId, true)
    }
  }, [tenantId, selectedDate, currentMonth, locationId, fetchDayAppointments, fetchMonthAppointments])

  const init = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users').select('tenant_id, tenants(id, settings)')
      .eq('user_id', user.id).limit(1).single()
    
    if (tuData?.tenants) {
      const tenant = tuData.tenants as any
      setTenantId(tenant.id)
      setLang(tenant.settings?.language || 'es')
      
      await Promise.all([
        fetchMeta(tenant.id, locationId),
        fetchMonthAppointments(tenant.id, currentMonth, locationId),
        fetchDayAppointments(tenant.id, selectedDate, locationId)
      ])
    }
    setLoading(false)
  }, [supabase, currentMonth, selectedDate, fetchMeta, fetchMonthAppointments, fetchDayAppointments])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (tenantId) {
      appointmentsCache.meta = null
      appointmentsCache.days = {}
      appointmentsCache.months = {}
      fetchMeta(tenantId, locationId)
      fetchDayAppointments(tenantId, selectedDate, locationId, true)
      fetchMonthAppointments(tenantId, currentMonth, locationId, true)
    }
  }, [locationId])

  // Real-time subscription
  useEffect(() => {
    if (!tenantId) return
    
    // Listen for appointment changes
    const aptChannel = supabase.channel('realtime-appointments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments', 
        filter: `tenant_id=eq.${tenantId}` 
      }, () => {
        // Clear caches on change to ensure consistency
        appointmentsCache.days = {};
        appointmentsCache.months = {};
        fetchMonthAppointments(tenantId, currentMonth, locationId, true)
        fetchDayAppointments(tenantId, selectedDate, locationId, true)
      })
      .subscribe()

    // Listen for availability override changes
    const overrideChannel = supabase.channel('realtime-overrides')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'professional_availability_overrides',
        filter: `tenant_id=eq.${tenantId}` 
      }, () => {
        // Clear caches
        appointmentsCache.days = {};
        refresh(); 
        
        // If we were looking at slots, refetch them to show the new block/unblock
        if (lastSlotParams.current) {
          fetchSlots(lastSlotParams.current.p, lastSlotParams.current.d, lastSlotParams.current.s)
        }
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(aptChannel)
      supabase.removeChannel(overrideChannel)
    }
  }, [tenantId, currentMonth, selectedDate, fetchMonthAppointments, fetchDayAppointments, supabase, refresh, fetchSlots])

  const cancelAppointment = async (id: string) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'cancelled' as any } : app))
    setAllMonthApps(prev => prev.map(app => app.id === id ? { ...app, status: 'cancelled' as any } : app))
    
    const res = await fetch(`/api/appointments?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    refresh()
    return res.ok
  }

  const navigateMonth = (direction: 'next' | 'prev') => {
    setCurrentMonth(m => direction === 'next' ? addMonths(m, 1) : subMonths(m, 1))
  }

  const markAsNotified = async (id: string, notes: string = '') => {
    setNotifyingId(id)
    const { error } = await supabase.from('appointments').update({ 
      cancellation_notified: true,
      cancellation_notified_notes: notes 
    }).eq('id', id)
    if (!error) {
      setPendingCalls(prev => prev.filter(c => c.id !== id))
    }
    setNotifyingId(null)
    return !error
  }

  const updateStatus = async (id: string, status: string) => {
    // Optimistic UI update
    const updateLocalState = (prev: Appointment[]) => 
      prev.map(app => app.id === id ? { ...app, status: status as any } : app);
    
    setAppointments(updateLocalState)
    setAllMonthApps(updateLocalState)

    // Update global cache immediately to prevent fetch regression
    Object.keys(appointmentsCache.days).forEach(key => {
      appointmentsCache.days[key] = updateLocalState(appointmentsCache.days[key]);
    });
    Object.keys(appointmentsCache.months).forEach(key => {
      appointmentsCache.months[key] = updateLocalState(appointmentsCache.months[key]);
    });

    const res = await fetch('/api/appointments/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, tenant_id: tenantId }),
    })
    
    // We don't call refresh() here because Real-time subscription will handle it, 
    // and we already updated the local state and cache optimistically.
    if (!res.ok) {
       refresh(); // Revert on error
    }
    return res.ok
  }

  return {
    appointments,
    allMonthApps,
    selectedDate,
    currentMonth,
    tenantId,
    locationId,
    services,
    professionals,
    availableSlots,
    slotLoading,
    isBlocked,
    blockReason,
    lang,
    loading,
    pendingCalls,
    notifyingId,
    setSelectedDate,
    setLocationId,
    navigateMonth,
    fetchSlots,
    cancelAppointment,
    markAsNotified,
    updateStatus,
    refresh
  }
}

"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

export interface Appointment {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  notes?: string;
  clients: { id: string; first_name: string; last_name: string; phone: string } | null;
  services: { name: string } | null;
  professionals: { id: string; full_name: string } | null;
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
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotLoading, setSlotLoading] = useState(false)
  const [pendingCalls, setPendingCalls] = useState<Appointment[]>([])
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [loading, setLoading] = useState(true)

  const fetchMeta = useCallback(async (tenantId: string) => {
    // Check cache first
    if (appointmentsCache.meta) {
      setServices(appointmentsCache.meta.services);
      setProfessionals(appointmentsCache.meta.professionals);
      return;
    }

    const { data: s } = await supabase.from('services').select('id, name').eq('tenant_id', tenantId).eq('active', true)
    const { data: p } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenantId).eq('active', true)
    
    if (s && p) {
      const meta = { services: s, professionals: p };
      appointmentsCache.meta = meta;
      setServices(s)
      setProfessionals(p)
    }
  }, [supabase])

  const fetchMonthAppointments = useCallback(async (tenantId: string, month: Date, force = false) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    const cacheKey = `${tenantId}-${start}-${end}`;

    if (!force && appointmentsCache.months[cacheKey]) {
      setAllMonthApps(appointmentsCache.months[cacheKey]);
      return;
    }

    const { data } = await supabase.from('appointments').select('id, status, start_at, clients(id), professionals(id)')
      .eq('tenant_id', tenantId).neq('status', 'cancelled')
      .gte('start_at', `${start}T00:00:00Z`).lte('start_at', `${end}T23:59:59Z`)
    
    if (data) {
      appointmentsCache.months[cacheKey] = data;
      setAllMonthApps(data as any[])
    }

    // Fetch pending notifications (any cancelled app where cancellation_notified is false)
    const { data: pending } = await supabase.from('appointments')
      .select('id, status, start_at, clients(first_name, last_name, phone), services(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'cancelled')
      .eq('cancellation_notified', false)
      .order('start_at', { ascending: true })
    if (pending) setPendingCalls(pending as any[])
  }, [supabase])

  const fetchDayAppointments = useCallback(async (tenantId: string, date: Date, force = false) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const cacheKey = `${tenantId}-${dateStr}`;

    if (!force && appointmentsCache.days[cacheKey]) {
      setAppointments(appointmentsCache.days[cacheKey]);
      return;
    }

    const { data } = await supabase.from('appointments')
      .select('id, status, start_at, end_at, notes, clients(id, first_name, last_name, phone), services(name), professionals(id, full_name)')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled","rescheduled")')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)
      .order('start_at', { ascending: true })
    
    if (data) {
      appointmentsCache.days[cacheKey] = data;
      setAppointments(data as any[])
    }
  }, [supabase])

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
        fetchMeta(tenant.id),
        fetchMonthAppointments(tenant.id, currentMonth),
        fetchDayAppointments(tenant.id, selectedDate)
      ])
    }
    setLoading(false)
  }, [supabase, currentMonth, selectedDate, fetchMeta, fetchMonthAppointments, fetchDayAppointments])

  useEffect(() => {
    init()
  }, [init])

  // Real-time subscription
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase.channel('realtime-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `tenant_id=eq.${tenantId}` }, () => {
        // Clear caches on change to ensure consistency
        appointmentsCache.days = {};
        appointmentsCache.months = {};
        fetchMonthAppointments(tenantId, currentMonth, true)
        fetchDayAppointments(tenantId, selectedDate, true)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, currentMonth, selectedDate, fetchMonthAppointments, fetchDayAppointments, supabase])

  const fetchSlots = useCallback(async (profId: string, dateStr: string) => {
    if (!profId || !tenantId || !dateStr) { setAvailableSlots([]); return }
    setSlotLoading(true)
    const date = parseISO(dateStr)
    const dayOfWeek = date.getDay()

    const { data: rules } = await supabase.from('availability_rules').select('*')
      .eq('tenant_id', tenantId).eq('professional_id', profId)
      .eq('day_of_week', dayOfWeek).eq('active', true)

    if (!rules || rules.length === 0) { setAvailableSlots([]); setSlotLoading(false); return }

    const { data: existingApps } = await supabase.from('appointments').select('start_at, end_at')
      .eq('tenant_id', tenantId).eq('professional_id', profId).neq('status', 'cancelled')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)

    const slots: string[] = []
    const now = new Date()

    for (const rule of rules) {
      let current = parseISO(`${dateStr}T${rule.start_time}`)
      const endRule = parseISO(`${dateStr}T${rule.end_time}`)

      while (current < endRule) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + 30 * 60000)

        if (slotStart < now) { current = slotEnd; continue }

        const isOccupied = existingApps?.some((a: any) => {
          const appStart = parseISO(a.start_at.slice(0, 19))
          const appEnd = parseISO(a.end_at.slice(0, 19))
          return appStart < slotEnd && appEnd > slotStart
        })

        if (!isOccupied) slots.push(format(slotStart, 'HH:mm'))
        current = slotEnd
      }
    }
    setAvailableSlots(slots)
    setSlotLoading(false)
  }, [tenantId, supabase])

  const cancelAppointment = async (id: string) => {
    const res = await fetch(`/api/appointments?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    if (res.ok) {
      await Promise.all([
        fetchDayAppointments(tenantId, selectedDate),
        fetchMonthAppointments(tenantId, currentMonth)
      ])
    }
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

  return {
    appointments,
    allMonthApps,
    selectedDate,
    currentMonth,
    tenantId,
    services,
    professionals,
    availableSlots,
    slotLoading,
    lang,
    loading,
    pendingCalls,
    notifyingId,
    setSelectedDate,
    navigateMonth,
    fetchSlots,
    cancelAppointment,
    markAsNotified,
    refresh: () => { 
      appointmentsCache.days = {};
      appointmentsCache.months = {};
      fetchDayAppointments(tenantId, selectedDate, true); 
      fetchMonthAppointments(tenantId, currentMonth, true) 
    }
  }
}

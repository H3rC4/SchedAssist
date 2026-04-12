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
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [loading, setLoading] = useState(true)

  const fetchMeta = useCallback(async (tenantId: string) => {
    const { data: s } = await supabase.from('services').select('id, name').eq('tenant_id', tenantId).eq('active', true)
    const { data: p } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenantId).eq('active', true)
    if (s) setServices(s)
    if (p) setProfessionals(p)
  }, [supabase])

  const fetchMonthAppointments = useCallback(async (tenantId: string, month: Date) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    const { data } = await supabase.from('appointments').select('id, status, start_at, clients(id), professionals(id)')
      .eq('tenant_id', tenantId).neq('status', 'cancelled')
      .gte('start_at', `${start}T00:00:00Z`).lte('start_at', `${end}T23:59:59Z`)
    if (data) setAllMonthApps(data as any[])
  }, [supabase])

  const fetchDayAppointments = useCallback(async (tenantId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const { data } = await supabase.from('appointments')
      .select('id, status, start_at, end_at, notes, clients(id, first_name, last_name, phone), services(name), professionals(id, full_name)')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled","rescheduled")')
      .gte('start_at', `${dateStr}T00:00:00Z`).lte('start_at', `${dateStr}T23:59:59Z`)
      .order('start_at', { ascending: true })
    if (data) setAppointments(data as any[])
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
        fetchMonthAppointments(tenantId, currentMonth)
        fetchDayAppointments(tenantId, selectedDate)
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
    setSelectedDate,
    navigateMonth,
    fetchSlots,
    cancelAppointment,
    refresh: () => { fetchDayAppointments(tenantId, selectedDate); fetchMonthAppointments(tenantId, currentMonth) }
  }
}

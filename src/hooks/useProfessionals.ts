"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Language } from '@/lib/i18n'

export interface AvailabilityRule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
}

export interface Professional {
  id: string;
  full_name: string;
  specialty: string | null;
  active: boolean;
  auth_email?: string;
  auth_password_hint?: string;
  user_id?: string;
  availability_rules: AvailabilityRule[];
}

export interface Override {
  id: string;
  override_date: string;
  override_type: 'block' | 'open';
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

export function useProfessionals() {
  const supabase = createClient()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [tenantId, setTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null)
  const [overrides, setOverrides] = useState<Override[]>([])
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions'>('schedule')
  
  // CRUD Status
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchProfessionals = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    
    if (tuData) {
      setTenantId(tuData.tenant_id)
      const { data: profs } = await supabase
        .from('professionals')
        .select(`
          *,
          availability_rules (*)
        `)
        .eq('tenant_id', tuData.tenant_id)
        .order('full_name')
      
      setProfessionals(profs || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  const fetchOverrides = async (profId: string) => {
    const { data } = await supabase
      .from('professional_overrides')
      .select('*')
      .eq('professional_id', profId)
      .order('override_date', { ascending: true })
    setOverrides(data || [])
  }

  const selectProfessional = (prof: Professional | null) => {
    setSelectedProf(prof)
    if (prof) {
      fetchOverrides(prof.id)
      setActiveTab('schedule')
      setSaved(false)
    }
  }

  const createProfessional = async (data: { full_name: string, specialty: string }) => {
    setSaving(true)
    const { data: newProf, error } = await supabase
      .from('professionals')
      .insert({
        tenant_id: tenantId,
        full_name: data.full_name,
        specialty: data.specialty || null,
        active: true
      })
      .select()
      .single()

    if (!error && newProf) {
      // Default rules
      const defaultRules = Array.from({ length: 7 }, (_, i) => ({
        professional_id: newProf.id,
        day_of_week: i,
        start_time: '09:00:00',
        end_time: '18:00:00',
        active: i > 0 && i < 6
      }))
      await supabase.from('availability_rules').insert(defaultRules)
      await fetchProfessionals()
      setSaving(false)
      return { success: true, prof: newProf }
    }
    setSaving(false)
    return { success: false, error }
  }

  const deleteProfessional = async (id: string) => {
    if (!confirm('Confirm delete?')) return
    await fetch(`/api/professionals?id=${id}&tenant_id=${tenantId}`, { method: 'DELETE' })
    selectProfessional(null)
    await fetchProfessionals()
  }

  const updateAvailability = async (profId: string, rules: AvailabilityRule[]) => {
    setSaving(true)
    for (const rule of rules) {
      if (rule.id) {
        await supabase.from('availability_rules').update(rule).eq('id', rule.id)
      } else {
        await supabase.from('availability_rules').insert({ ...rule, professional_id: profId })
      }
    }
    setSaved(true)
    setSaving(false)
    await fetchProfessionals()
    setTimeout(() => setSaved(false), 3000)
  }

  return {
    professionals,
    loading,
    tenantId,
    selectedProf,
    overrides,
    activeTab,
    saving,
    saved,
    setActiveTab,
    selectProfessional,
    createProfessional,
    deleteProfessional,
    updateAvailability,
    refresh: fetchProfessionals,
    setOverrides
  }
}

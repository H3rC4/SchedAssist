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
  tenant_id: string;
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions' | 'access'>('schedule')
  
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
    if (prof) {
      // Repair if rules are missing
      const rules = [...(prof.availability_rules || [])];
      for (let i = 0; i < 7; i++) {
        if (!rules.find(r => r.day_of_week === i)) {
          rules.push({
            day_of_week: i,
            start_time: '09:00:00',
            end_time: '18:00:00',
            active: i > 0 && i < 6
          });
        }
      }
      prof.availability_rules = rules.sort((a,b) => a.day_of_week - b.day_of_week);
      
      setSelectedProf(prof)
      fetchOverrides(prof.id)
      setActiveTab('schedule')
      setSaved(false)
    } else {
      setSelectedProf(null)
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
    try {
      const res = await fetch('/api/professionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: profId, tenant_id: tenantId, rules })
      })
      if (!res.ok) throw new Error('API Error')
      setSaved(true)
      await fetchProfessionals()
      // Sincronizar profesional seleccionado para reflejar cambios (ej: auth_email)
      if (profId) {
        const { data: updatedProf } = await supabase
          .from('professionals')
          .select('*, availability_rules(*)')
          .eq('id', profId)
          .single()
        if (updatedProf) setSelectedProf(updatedProf)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const addOverride = async (profId: string, data: { date: string, type: 'block' | 'open' }) => {
    const { error } = await supabase.from('professional_overrides').insert({
      professional_id: profId,
      tenant_id: tenantId,
      override_date: data.date,
      override_type: data.type,
      start_time: data.type === 'open' ? '09:00:00' : null,
      end_time: data.type === 'open' ? '18:00:00' : null
    })
    if (!error) await fetchOverrides(profId)
  }

  const deleteOverride = async (profId: string, overrideId: string) => {
    const { error } = await supabase.from('professional_overrides').delete().eq('id', overrideId)
    if (!error) await fetchOverrides(profId)
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
    addOverride,
    deleteOverride,
    refresh: fetchProfessionals,
    setOverrides
  }
}

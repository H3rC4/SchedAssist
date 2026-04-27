"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfessionals, AvailabilityRule } from '@/hooks/useProfessionals'
import { AddProfessionalModal } from '@/components/professionals/AddProfessionalModal'
import { ProfessionalDetailDrawer } from '@/components/professionals/ProfessionalDetailDrawer'
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard'
import { translations, Language } from '@/lib/i18n'

export default function ProfessionalsPage() {
  const {
    professionals,
    loading,
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
    locations
  } = useProfessionals()

  const [showAddForm, setShowAddForm] = useState(false)
  const [lang, setLang] = useState<Language>('es')
  const [editRules, setEditRules] = useState<AvailabilityRule[]>([])

  const supabase = createClient()
  const T_ui = translations[lang] || translations['en']

  useEffect(() => {
    async function fetchLang() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tuData } = await supabase.from('tenant_users').select('tenants(settings)').eq('user_id', user.id).single()
      if (tuData?.tenants) {
        setLang(((tuData.tenants as any).settings?.language as Language) || 'es')
      }
    }
    fetchLang()
  }, [])

  useEffect(() => {
    if (selectedProf) {
      setEditRules([...selectedProf.availability_rules].sort((a,b) => a.day_of_week - b.day_of_week))
    }
  }, [selectedProf])

  const updateRule = (day: number, field: string, value: any) => {
    setEditRules(rules => rules.map(r => r.day_of_week === day ? { ...r, [field]: value } : r))
  }

  const toggleLunchBreak = (day: number, active: boolean) => {
    updateRule(day, 'lunch_break_start', active ? '13:00' : null)
    updateRule(day, 'lunch_break_end', active ? '14:00' : null)
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent-500" />
      </div>
    )
  }

  const handleCreateProfessional = async (data: any) => {
    const res = await createProfessional(data)
    if (res.success && res.prof) {
      setTimeout(() => {
        selectProfessional(res.prof)
      }, 1500)
    }
    return res
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">{T_ui.staff_title}</h1>
          <p className="text-xs md:text-sm text-primary-300 font-bold uppercase tracking-widest">{T_ui.staff_subtitle}</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-xl md:rounded-[1rem] bg-accent-500 px-4 py-3 md:py-2.5 text-sm font-black text-primary-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-accent-400 uppercase tracking-widest transition-all w-full sm:w-auto"
        >
          <UserPlus className="-ml-1 mr-2 h-5 w-5" /> {T_ui.add_professional_btn}
        </button>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {professionals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-primary-300 bg-primary-900/20 rounded-[2rem] border-2 border-dashed border-white/10">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="px-4 font-bold uppercase tracking-widest">{T_ui.no_professionals_yet}</p>
          </div>
        ) : (
          professionals.map(prof => (
            <ProfessionalCard 
              key={prof.id} 
              professional={prof} 
              onClick={() => selectProfessional(prof)} 
            />
          ))
        )}
      </div>

      {/* MODALS SECTION */}
      <AddProfessionalModal 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)} 
        onConfirm={handleCreateProfessional}
        locations={locations}
        t={{
          newProf: T_ui.new_professional,
          subtitle: T_ui.staff_subtitle,
          fullName: T_ui.fullName,
          fullNamePH: T_ui.fullNamePH,
          specialty: T_ui.specialty,
          specialtyPH: T_ui.specialtyPH,
          created: T_ui.created,
          createBtn: T_ui.create,
          locationLabel: T_ui.location_label,
          selectLocationOptional: T_ui.select_location_optional
        }}
      />

      {selectedProf && (
        <ProfessionalDetailDrawer 
          professional={selectedProf}
          locations={locations}
          onClose={() => selectProfessional(null)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          editRules={editRules}
          updateRule={updateRule}
          toggleLunchBreak={toggleLunchBreak}
          overrides={overrides}
          onDelete={() => deleteProfessional(selectedProf.id)}
          onSave={(generalInfo?: any) => updateAvailability(selectedProf.id, editRules, generalInfo)}
          addOverride={(date, formData) => addOverride(selectedProf.id, { date, ...formData })}
          deleteOverride={(id) => deleteOverride(selectedProf.id, id)}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  )
}

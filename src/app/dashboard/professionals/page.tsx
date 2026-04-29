"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2, Search, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfessionals, AvailabilityRule } from '@/hooks/useProfessionals'
import { AddProfessionalModal } from '@/components/professionals/AddProfessionalModal'
import { ProfessionalDetailDrawer } from '@/components/professionals/ProfessionalDetailDrawer'
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard'
import { translations, Language } from '@/lib/i18n'

import { useLandingTranslation } from '@/components/LanguageContext'

export default function ProfessionalsPage() {
  const { language: lang, fullT: T_ui } = useLandingTranslation()
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
  const [editRules, setEditRules] = useState<AvailabilityRule[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

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
      <div className="flex h-[70vh] items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const filteredProfessionals = professionals.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 bg-surface min-h-screen p-2 md:p-3 animate-in fade-in duration-700">
      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto">
        {/* COMPACT HEADER */}
        <div className="relative z-10 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h1 className="text-lg md:text-xl font-black tracking-tighter text-on-surface leading-tight uppercase">
                {T_ui.staff_title}
              </h1>
              <p className="mt-0.5 text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
                {T_ui.staff_subtitle}
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="precision-button-primary py-1.5 px-4 text-[9px] group flex items-center gap-2 h-fit"
            >
              <span>{T_ui.add_professional_btn}</span>
              <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* COMPACT SEARCH BAR */}
          <div className="mt-4 max-w-sm">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-muted group-focus-within:text-primary transition-colors">
                <Search className="h-3 w-3" />
              </div>
              <input
                type="text"
                placeholder={T_ui.search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 bg-precision-surface-lowest border border-on-surface/5 rounded-xl shadow-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[10px] font-bold text-on-surface placeholder:text-on-surface-muted/40 placeholder:text-[8px] placeholder:uppercase placeholder:tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* UNIFORM GRID SECTION */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredProfessionals.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-precision-surface-lowest/50 backdrop-blur-sm rounded-xl border border-dashed border-on-surface/10">
              <div className="h-10 w-10 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-on-surface-muted" />
              </div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight">{T_ui.no_professionals_yet}</h3>
              <p className="mt-0.5 text-[8px] font-bold text-on-surface-muted uppercase tracking-widest">
                {lang === 'es' ? 'COMIENZA AGREGANDO A TU EQUIPO' : lang === 'it' ? 'INIZIA AGGIUNGENDO IL TUO TEAM' : 'START BY ADDING YOUR TEAM'}
              </p>
            </div>
          ) : (
            filteredProfessionals.map((prof) => (
              <div key={prof.id} className="h-full">
                <ProfessionalCard 
                  professional={prof} 
                  onClick={() => selectProfessional(prof)} 
                />
              </div>
            ))
          )}
        </div>
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

"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2, Search, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfessionals, AvailabilityRule } from '@/hooks/useProfessionals'
import { AnimatePresence } from 'framer-motion'
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
    <div className="flex-1 bg-surface min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* HEADER */}
        <header>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase mb-2">
            {T_ui.staff_title?.split(' ')[0]} <span className="text-primary italic font-serif lowercase">& {T_ui.staff_title?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em]">
            {T_ui.staff_subtitle}
          </p>
        </header>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative group w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface/40 group-focus-within:text-primary transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder={T_ui.search_placeholder || 'Search professionals...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-on-surface/5 rounded-[1.5rem] shadow-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-xs font-bold text-on-surface placeholder:text-on-surface/30 placeholder:text-[10px] placeholder:uppercase placeholder:tracking-widest outline-none"
            />
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
          >
            <span>{T_ui.add_professional_btn || 'Add Professional'}</span>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* LIST SECTION */}
        <div className="flex flex-col gap-4 max-w-5xl">
          {filteredProfessionals.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-[2rem] border border-on-surface/5 shadow-sm">
              <div className="h-16 w-16 bg-on-surface/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-on-surface/20" />
              </div>
              <h3 className="text-lg font-black text-on-surface uppercase tracking-tighter">{T_ui.no_professionals_yet}</h3>
              <p className="mt-2 text-[10px] font-bold text-on-surface/40 uppercase tracking-[0.2em]">
                {T_ui.start_team_cta || 'START BY ADDING YOUR TEAM'}
              </p>
            </div>
          ) : (
            filteredProfessionals.map((prof) => (
              <ProfessionalCard 
                key={prof.id}
                professional={prof} 
                onClick={() => selectProfessional(prof)} 
                t={T_ui}
              />
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

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  )
}

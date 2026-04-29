"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2, Search, ArrowRight } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

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
      <div className="flex h-[70vh] items-center justify-center bg-surface">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
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
    <div className="flex-1 bg-surface min-h-screen p-4 md:p-6 animate-in fade-in duration-700">
      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary-600 blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-600 blur-[100px]" />
      </div>

      {/* EDITORIAL HEADER */}
      <div className="relative z-10 mb-10 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-[calc(-0.04em)] text-slate-900 leading-[0.9] uppercase">
              {T_ui.staff_title}
            </h1>
            <p className="mt-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.3em] pl-1">
              {T_ui.staff_subtitle}
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="group relative h-12 md:h-13 px-6 md:px-8 bg-primary-600 text-white rounded-xl overflow-hidden shadow-spatial transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <span className="text-sm md:text-base font-black uppercase tracking-widest">{T_ui.add_professional_btn}</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="mt-12 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={lang === 'es' ? 'Buscar profesional...' : 'Search staff...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-14 pr-6 bg-precision-surface-lowest border-none rounded-xl shadow-spatial focus:ring-2 focus:ring-primary-600 transition-all text-slate-900 font-bold placeholder:text-slate-300 placeholder:uppercase placeholder:tracking-widest placeholder:text-[9px]"
            />
          </div>
        </div>
      </div>

      {/* ASYMMETRIC GRID SECTION */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredProfessionals.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-precision-surface-lowest/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 shadow-spatial">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{T_ui.no_professionals_yet}</h3>
            <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              {lang === 'es' ? 'Comienza agregando a tu equipo' : 'Start by adding your team'}
            </p>
          </div>
        ) : (
          filteredProfessionals.map((prof, idx) => (
            <div 
              key={prof.id}
              className={`${idx % 5 === 0 ? 'md:col-span-2 lg:col-span-2' : ''} h-full`}
            >
              <ProfessionalCard 
                professional={prof} 
                onClick={() => selectProfessional(prof)} 
              />
            </div>
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

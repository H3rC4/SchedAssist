"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2 } from 'lucide-react'
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
  } = useProfessionals()

  const [showAddForm, setShowAddForm] = useState(false)
  const [lang, setLang] = useState<Language>('es')
  const [editRules, setEditRules] = useState<AvailabilityRule[]>([])

  const T_ui = translations[lang] || translations['en']

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
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{T_ui.staff_title}</h1>
          <p className="text-xs md:text-sm text-gray-500">{T_ui.staff_subtitle}</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center rounded-xl md:rounded-lg bg-primary-600 px-4 py-3 md:py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          <UserPlus className="-ml-1 mr-2 h-5 w-5" /> {T_ui.add_professional_btn}
        </button>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {professionals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p className="px-4">No hay profesionales registrados aún.</p>
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
        onConfirm={createProfessional}
        t={{
          newProf: 'Nuevo Profesional',
          subtitle: T_ui.staff_subtitle,
          fullName: 'Nombre Completo',
          fullNamePH: 'Ej: Dr. Mario Rossi',
          specialty: 'Especialidad',
          specialtyPH: 'Ej: Pediatría',
          created: '¡Creado!',
          createBtn: 'Crear'
        }}
      />

      {selectedProf && (
        <ProfessionalDetailDrawer 
          professional={selectedProf}
          onClose={() => selectProfessional(null)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          editRules={editRules}
          updateRule={updateRule}
          toggleLunchBreak={toggleLunchBreak}
          overrides={overrides}
          onDelete={() => deleteProfessional(selectedProf.id)}
          onSave={() => updateAvailability(selectedProf.id, editRules)}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  )
}

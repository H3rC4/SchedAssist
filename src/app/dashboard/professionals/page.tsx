"use client"

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2, Search, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfessionals, AvailabilityRule } from '@/hooks/useProfessionals'
import { AnimatePresence } from 'framer-motion'
import { ProfessionalDrawer } from '@/components/professionals/ProfessionalDrawer'
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard'
import { SecretaryModal } from '@/components/dashboard/SecretaryModal'

import { useLandingTranslation } from '@/components/LanguageContext'

type DrawerMode = 'create' | 'edit'

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

  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null)
  const [editRules, setEditRules] = useState<AvailabilityRule[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSecretaryModal, setShowSecretaryModal] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string>('')

  const supabase = createClient()

  // Fetch user role
  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('tenant_users')
        .select('role, tenant_id')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setUserRole(data.role)
        setTenantId(data.tenant_id)
      }
    }
    fetchRole()
  }, [])

  useEffect(() => {
    if (selectedProf) {
      setDrawerMode('edit')
      setEditRules([...selectedProf.availability_rules].sort((a,b) => a.day_of_week - b.day_of_week))
    }
  }, [selectedProf])

  useEffect(() => {
    if (saved && drawerMode === 'edit') {
      setTimeout(() => {
        handleCloseDrawer()
      }, 1000)
    }
  }, [saved])

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
      selectProfessional(res.prof, 'access')
    }
    return res
  }

  const handleCloseDrawer = () => {
    selectProfessional(null)
    setDrawerMode(null)
  }

  const filteredProfessionals = professionals.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 bg-surface min-h-screen p-2 md:p-3 animate-in fade-in duration-700">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto">
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
            <div className="flex items-center gap-3">
              {/* Secretary button — admin only */}
              {userRole === 'tenant_admin' && (
                <button
                  onClick={() => setShowSecretaryModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-100 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <UserPlus className="h-[14px] w-[14px]" />
                  <span className="hidden sm:inline">
                    {lang === 'es' ? 'Secretaria' : lang === 'it' ? 'Segretaria' : 'Secretary'}
                  </span>
                </button>
              )}
              {/* New Professional button — admin only */}
              {userRole === 'tenant_admin' && (
                  <button
                    onClick={() => setDrawerMode('create')}
                    data-tour="staff-add-btn"
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10.5px] uppercase tracking-[0.2em] hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg group"
                  >
                  <span>{T_ui.add_professional_btn}</span>
                  <Plus className="h-[15px] w-[15px] group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 max-w-sm">
            <div className="relative group" data-tour="staff-search">
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

        <div className="relative z-10 flex flex-col gap-3 max-w-4xl">
          {filteredProfessionals.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-precision-surface-lowest/50 backdrop-blur-sm rounded-xl border border-dashed border-on-surface/10">
              <div className="h-10 w-10 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-on-surface-muted" />
              </div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight">{T_ui.no_professionals_yet}</h3>
              <p className="mt-0.5 text-[8px] font-bold text-on-surface-muted uppercase tracking-widest">
                {T_ui.start_team_cta || 'START BY ADDING YOUR TEAM'}
              </p>
            </div>
          ) : (
            filteredProfessionals.map((prof, idx) => (
              <div key={prof.id} className="h-full" data-tour={idx === 0 ? "staff-card" : undefined}>
                <ProfessionalCard 
                  professional={prof} 
                  onClick={() => selectProfessional(prof)} 
                  t={T_ui}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawerMode && (
          <ProfessionalDrawer
            mode={selectedProf ? 'edit' : drawerMode}
            professional={selectedProf}
            onClose={handleCloseDrawer}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            editRules={editRules}
            updateRule={updateRule}
            toggleLunchBreak={toggleLunchBreak}
            overrides={overrides}
            onDelete={() => { if (selectedProf) deleteProfessional(selectedProf.id) }}
            onSave={(generalInfo?: any) => { if (selectedProf) updateAvailability(selectedProf.id, editRules, generalInfo) }}
            addOverride={(date, formData) => { if (selectedProf) addOverride(selectedProf.id, { date, ...formData }) }}
            deleteOverride={(id) => { if (selectedProf) deleteOverride(selectedProf.id, id) }}
            saving={saving}
            saved={saved}
            locations={locations}
            onCreate={handleCreateProfessional}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSecretaryModal && (
          <SecretaryModal
            tenantId={tenantId}
            lang={lang}
            onClose={() => setShowSecretaryModal(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, User, Phone, Calendar, X, ChevronRight, Edit2, ArrowLeft, Upload, FileText, Download, Stethoscope, Paperclip, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { translations } from '@/lib/i18n'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { it } from 'date-fns/locale/it'
import { enUS } from 'date-fns/locale/en-US'

// Removed local i18n object to use global translations

interface MedicalEntry {
  id: string;
  date: string;
  content: string;
}

interface MedicalNotes {
  summary: string;
  logs: MedicalEntry[];
}

interface Client {
  id: string; first_name: string; last_name: string; phone: string;
  notes: string | null; created_at: string; appointments?: any[];
}

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientApps, setClientApps] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [lang, setLang] = useState<'en' | 'es' | 'it'>('es')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '', notes: '' })
  const [editingAppId, setEditingAppId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [appNoteEdit, setAppNoteEdit] = useState('')
  const [postNoteEdit, setPostNoteEdit] = useState('')
  const [isSavingAppNote, setIsSavingAppNote] = useState(false)

  // EHR States
  const [activeTab, setActiveTab] = useState<'perfil' | 'historia'>('perfil')
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([])
  const [newRecordText, setNewRecordText] = useState('')
  const [isSavingRecord, setIsSavingRecord] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userProfessionalId, setUserProfessionalId] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [editRecordText, setEditRecordText] = useState('')

  const fetchClinicalRecords = useCallback(async (clientId: string) => {
    if (!tenantId || !clientId) return
    const res = await fetch(`/api/clinical-records?tenant_id=${tenantId}&client_id=${clientId}`)
    if (res.ok) {
      const data = await res.json()
      setClinicalRecords(data)
    }
  }, [tenantId])

  const initTenant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(id, settings)')
      .eq('user_id', user.id)
      .limit(1).single()

    if (tuData?.tenants) {
      const tenant = tuData.tenants as any
      setTenantId(tenant.id)
      setUserRole(tuData.role)
      setLang((tenant.settings?.language as 'en'|'es'|'it') || 'es')
    }

    // If professional, get their professional ID for ownership checks
    const { data: profData } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profData) setUserProfessionalId(profData.id)
  }, [supabase])

  const fetchClients = useCallback(async () => {
    if (!tenantId) return
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, notes, created_at')
      .eq('tenant_id', tenantId)
      .order('first_name')
    if (data) {
      const real = data.filter(c => !c.phone.startsWith('tg_'))
      setClients(real)
      setFilteredClients(real)
    }
  }, [supabase, tenantId])

  useEffect(() => { initTenant() }, [initTenant])
  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    if (!tenantId) return
    const channel = supabase.channel('rt_clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, fetchClients, supabase])

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredClients(clients) } else {
      const term = searchTerm.toLowerCase()
      setFilteredClients(clients.filter(c => c.first_name.toLowerCase().includes(term) || c.last_name.toLowerCase().includes(term) || c.phone.includes(term)))
    }
  }, [searchTerm, clients])

  async function openClientDetail(client: Client) {
    setSelectedClient(client)
    setIsEditing(false)
    setEditingAppId(null)
    const medical = parseMedicalNotes(client.notes)
    setEditData({ 
      first_name: client.first_name || '', 
      last_name: client.last_name || '', 
      phone: client.phone || '',
      notes: medical.summary // Global edit only edits the fixed summary
    })
    setActiveTab('perfil')
    const { data } = await supabase.from('appointments').select(`id, status, start_at, end_at, notes, services(name), professionals(full_name)`).eq('client_id', client.id).order('start_at', { ascending: false })
    setClientApps(data || [])
    fetchClinicalRecords(client.id)
  }

  // Helper to parse complex medical notes (summary + logs)
  const parseMedicalNotes = (notesStr: string | null): MedicalNotes => {
    const defaultVal: MedicalNotes = { summary: '', logs: [] }
    if (!notesStr) return defaultVal
    try {
      const parsed = JSON.parse(notesStr)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { 
          summary: parsed.summary || '', 
          logs: Array.isArray(parsed.logs) ? parsed.logs : [] 
        }
      }
      if (Array.isArray(parsed)) {
        return { summary: '', logs: parsed }
      }
      return { summary: notesStr, logs: [] }
    } catch (e) {
      return { summary: notesStr, logs: [] }
    }
  }

  async function handleUpdateSummary(newSummary: string) {
    if (!selectedClient) return
    const current = parseMedicalNotes(selectedClient.notes)
    const updatedNotes = JSON.stringify({ ...current, summary: newSummary })

    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedClient.id,
        tenant_id: tenantId,
        data: { ...selectedClient, notes: updatedNotes }
      })
    })

    if (res.ok) {
      setSelectedClient({ ...selectedClient, notes: updatedNotes })
      fetchClients()
    }
  }

  // Helper for appointment entries (posts)
  const parseAppEntries = (notesStr: string | null): MedicalEntry[] => {
    if (!notesStr) return []
    try {
      const parsed = JSON.parse(notesStr)
      if (Array.isArray(parsed)) return parsed
      return [{ id: 'legacy', date: new Date().toISOString(), content: notesStr }]
    } catch (e) {
      return [{ id: 'legacy', date: new Date().toISOString(), content: notesStr }]
    }
  }

  async function handleAddAppPost(appId: string) {
    if (!appNoteEdit.trim()) return
    setIsSavingAppNote(true)
    
    const app = clientApps.find(a => a.id === appId)
    const currentEntries = parseAppEntries(app?.notes || null)
    const newEntry: MedicalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content: appNoteEdit.trim()
    }
    
    // Most recent at the bottom or top? User said "abajo me aparesca otro recuadro". 
    // Usually posts go Chronological (Oldest top, Newest bottom) in medical logs.
    const updatedEntries = [...currentEntries, newEntry]
    const updatedNotesStr = JSON.stringify(updatedEntries)

    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, tenant_id: tenantId, notes: updatedNotesStr })
    })

    if (res.ok) {
      setClientApps(clientApps.map(a => a.id === appId ? { ...a, notes: updatedNotesStr } : a))
      setAppNoteEdit('') // Clear for next post
    }
    setIsSavingAppNote(false)
  }

  async function handleDeleteAppPost(appId: string, entryId: string) {
    if (!confirm(translations[lang].confirm_delete_note || '¿Borrar comentario?')) return
    const app = clientApps.find(a => a.id === appId)
    const currentEntries = parseAppEntries(app?.notes || null)
    const updatedEntries = currentEntries.filter(e => e.id !== entryId)
    const updatedNotesStr = JSON.stringify(updatedEntries)

    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, tenant_id: tenantId, notes: updatedNotesStr })
    })

    if (res.ok) {
      setClientApps(clientApps.map(a => a.id === appId ? { ...a, notes: updatedNotesStr } : a))
    }
  }

  async function handleSavePostEdit(appId: string, entryId: string) {
    const app = clientApps.find(a => a.id === appId)
    const currentEntries = parseAppEntries(app?.notes || null)
    const updatedEntries = currentEntries.map(e => e.id === entryId ? { ...e, content: postNoteEdit } : e)
    const updatedNotesStr = JSON.stringify(updatedEntries)

    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, tenant_id: tenantId, notes: updatedNotesStr })
    })

    if (res.ok) {
      setClientApps(clientApps.map(a => a.id === appId ? { ...a, notes: updatedNotesStr } : a))
      setEditingPostId(null)
    }
  }

  // EHR Actions
  async function handleSaveClinicalRecord() {
    if (!selectedClient || !newRecordText.trim()) return
    setIsSavingRecord(true)
    const res = await fetch('/api/clinical-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        client_id: selectedClient.id,
        content: newRecordText
      })
    })
    if (res.ok) {
      setNewRecordText('')
      fetchClinicalRecords(selectedClient.id)
    }
    setIsSavingRecord(false)
  }

  async function handleEditClinicalRecord(recordId: string) {
    if (!editRecordText.trim() || !selectedClient) return
    const res = await fetch(`/api/clinical-records?id=${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editRecordText })
    })
    if (res.ok) {
      setEditingRecordId(null)
      fetchClinicalRecords(selectedClient.id)
    } else {
      alert((translations[lang] as any).error_save || 'Error al guardar')
    }
  }

  async function handleDeleteClinicalRecord(recordId: string) {
    const confirmMsg = lang === 'it' ? 'Eliminare questo registro clinico?' : (lang === 'en' ? 'Delete this clinical record?' : '¿Eliminar este registro clínico?')
    if (!confirm(confirmMsg)) return
    if (!selectedClient) return
    const res = await fetch(`/api/clinical-records?id=${recordId}&tenant_id=${tenantId}`, {
      method: 'DELETE'
    })
    if (res.ok || res.status === 204) {
      fetchClinicalRecords(selectedClient.id)
    } else {
      alert((translations[lang] as any).error || 'Error')
    }
  }

  function canEditRecord(record: any): boolean {
    if (userRole === 'admin' || userRole === 'tenant_admin' || userRole === 'owner') return true
    if (userRole === 'professional' && userProfessionalId && record.professionals?.id === userProfessionalId) return true
    return false
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedClient || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      alert((translations[lang] as any).file_too_large || "El archivo es demasiado grande (Máx 5MB)")
      return
    }

    setUploadingFiles(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${tenantId}/${selectedClient.id}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('clinical_files')
      .upload(fileName, file)

    if (uploadError) {
      alert((translations[lang].error_save || "Error al subir archivo") + ": " + uploadError.message)
      setUploadingFiles(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clinical_files')
      .getPublicUrl(fileName)

    // Save as a new record with attachment
    const res = await fetch('/api/clinical-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        client_id: selectedClient.id,
        content: newRecordText.trim() || `Archivo adjunto: ${file.name}`,
        attachments: [{ name: file.name, url: publicUrl }]
      })
    })

    if (res.ok) {
      setNewRecordText('')
      fetchClinicalRecords(selectedClient.id)
    }
    setUploadingFiles(false)
  }

  async function handleSaveEdit() {
    if (!selectedClient) return
    const currentMedical = parseMedicalNotes(selectedClient.notes)
    const updatedNotesStr = JSON.stringify({ 
      ...currentMedical, 
      summary: editData.notes // The 'notes' field in editData is the summary
    })

    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedClient.id,
        tenant_id: tenantId,
        data: { 
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone,
          notes: updatedNotesStr
        }
      })
    })

    if (res.ok) {
      setSelectedClient({ 
        ...selectedClient, 
        ...editData, 
        last_name: editData.last_name || '',
        notes: updatedNotesStr
      })
      setIsEditing(false)
      fetchClients()
    } else {
      const resp = await res.json()
      alert((translations[lang] || translations['en']).error_save + ': ' + (resp.error || 'Unknown error'))
    }
  }

  const exportPatientHistory = () => {
    if (!selectedClient || clientApps.length === 0) {
      alert(t.no_activity_today || 'No hay datos para exportar');
      return;
    }

    let textContent = `CLINICAL HISTORY - ${selectedClient.first_name.toUpperCase()} ${selectedClient.last_name?.toUpperCase()}\n`;
    textContent += `Phone: ${selectedClient.phone}\n`;
    textContent += `Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n`;
    textContent += `--------------------------------------------------\n\n`;

    clientApps.forEach((app, index) => {
      const entries = parseAppEntries(app.notes);
      textContent += `APPOINTMENT #${clientApps.length - index}\n`;
      textContent += `Date: ${format(parseISO(app.start_at), 'yyyy-MM-dd HH:mm')}\n`;
      textContent += `Service: ${app.services?.name || 'N/A'}\n`;
      textContent += `Professional: ${app.professionals?.full_name || 'N/A'}\n`;
      textContent += `Status: ${app.status.toUpperCase()}\n`;
      
      if (entries.length > 0) {
        textContent += `Medical Notes:\n`;
        entries.forEach(e => {
          textContent += `  - [${format(parseISO(e.date), 'HH:mm')}] ${e.content}\n`;
        });
      }
      textContent += `\n--------------------------------------------------\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_${selectedClient.first_name}_${selectedClient.last_name}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const t = translations[lang] || translations['en']
  const dateLocale = lang === 'it' ? it : (lang === 'es' ? es : enUS)
  
  const statusLabel = (s: string) => {
    switch(s) {
      case 'pending': return { text: t.pending, cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'awaiting_confirmation': return { text: t.awaiting, cls: 'bg-primary-600/10 text-primary-600 border-primary-600/20' };
      case 'confirmed': return { text: t.confirmed, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'cancelled': return { text: t.canceled, cls: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'completed': return { text: t.confirmed, cls: 'bg-primary-600/10 text-primary-600 border-primary-600/20' };
      default: return { text: s, cls: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20' };
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 pt-16 max-w-[1600px] mx-auto space-y-16">
        {/* Massive Editorial Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-primary-600" />
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">{t.patient_management}</span>
          </div>
          <h1 className="text-7xl xl:text-8xl font-black text-secondary-900 tracking-tighter leading-[0.85] uppercase">
            {t.patient_management.split(' ')[0]}<br/>
            <span className="text-primary-600">{t.patient_management.split(' ').slice(1).join(' ') || 'Records'}</span>
          </h1>
          <p className="max-w-xl text-lg font-medium text-secondary-500 leading-relaxed pt-4">
            {t.patient_management_subtitle}
          </p>
        </header>

        {/* Search and Filter Row */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-secondary-300 group-focus-within:text-primary-600 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-precision-surface-lowest border-0 rounded-2xl py-6 pl-16 pr-8 text-lg font-bold text-secondary-900 shadow-spatial focus:ring-4 focus:ring-primary-600/5 transition-all outline-none placeholder:text-secondary-200"
              placeholder={t.search_patients_placeholder} 
            />
          </div>
          <div className="px-8 py-6 bg-precision-surface-lowest rounded-2xl shadow-spatial flex items-center gap-4 border border-surface-container-low">
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{t.total_active}</span>
            <span className="text-2xl font-black text-secondary-900">{filteredClients.length}</span>
          </div>
        </div>

        {/* Asymmetric Grid of Precision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredClients.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-surface-container-low flex items-center justify-center">
                <User className="h-10 w-10 text-secondary-200" />
              </div>
              <p className="text-sm font-black text-secondary-300 uppercase tracking-widest">{t.no_patients_found}</p>
            </div>
          ) : (
            filteredClients.map((c, idx) => (
              <button 
                key={c.id} 
                onClick={() => openClientDetail(c)}
                className={`group relative text-left bg-precision-surface-lowest p-8 rounded-3xl shadow-spatial border border-surface-container-low hover:border-primary-600/30 transition-all duration-500 overflow-hidden ${
                  idx % 5 === 0 ? 'md:col-span-2' : ''
                }`}
              >
                {/* Decorative Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-bl-[100px] group-hover:bg-primary-600 group-hover:scale-110 transition-all duration-500 -mr-12 -mt-12" />
                
                <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="h-14 w-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-xl font-black text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                      {c.first_name.charAt(0)}{c.last_name?.charAt(0) || ''}
                    </div>
                    <div className="p-2 rounded-xl bg-surface-container-low group-hover:bg-primary-600/10 transition-colors">
                      <ChevronRight className="h-5 w-5 text-secondary-300 group-hover:text-primary-600" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-secondary-900 tracking-tight group-hover:text-primary-600 transition-colors mb-2">
                      {c.first_name} {c.last_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary-400">
                      <Phone className="h-3.5 w-3.5" />
                      {c.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-surface-container-low/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-secondary-300 uppercase tracking-widest">{t.since || 'Member Since'}</span>
                      <span className="text-xs font-bold text-secondary-900">
                        {format(parseISO(c.created_at), 'MMM yyyy', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Premium Right-side Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-500" 
            onClick={() => { setSelectedClient(null); setIsEditing(false); }}
          />

          <div className="relative w-full max-w-4xl h-full bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            {/* Drawer Header */}
            <div className="p-8 border-b border-surface-container-low bg-precision-surface-lowest sticky top-0 z-20">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                    {selectedClient.first_name.charAt(0)}{selectedClient.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-secondary-900 tracking-tight">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </h2>
                    <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-primary-600" /> {selectedClient.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="flex items-center gap-2 bg-surface-container-low hover:bg-primary-600/10 text-primary-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Edit2 className="h-4 w-4" /> {t.edit}
                    </button>
                  )}
                  <button 
                    onClick={() => { setSelectedClient(null); setIsEditing(false); }}
                    className="p-3 rounded-xl bg-surface-container-low text-secondary-400 hover:text-secondary-900 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              {!isEditing && (
                <nav className="flex gap-10 mt-12">
                  {[
                    { id: 'perfil', label: 'Profile & Appointments', icon: User },
                    { id: 'historia', label: 'Clinical History', icon: Stethoscope }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === tab.id ? 'text-primary-600' : 'text-secondary-300 hover:text-secondary-900'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-full animate-in zoom-in duration-300" />
                      )}
                    </button>
                  ))}
                </nav>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-12 bg-surface custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-12">
                {isEditing ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header>
                      <h3 className="text-xl font-black text-secondary-900 uppercase tracking-widest mb-2">{t.edit_patient_data}</h3>
                      <div className="h-1 w-12 bg-primary-600 rounded-full" />
                    </header>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">{t.name}</label>
                        <input type="text" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="w-full bg-precision-surface-lowest border-0 rounded-2xl py-5 px-6 text-sm font-bold text-secondary-900 shadow-spatial focus:ring-4 focus:ring-primary-600/5 transition-all outline-none"/>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">{t.last_name}</label>
                        <input type="text" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="w-full bg-precision-surface-lowest border-0 rounded-2xl py-5 px-6 text-sm font-bold text-secondary-900 shadow-spatial focus:ring-4 focus:ring-primary-600/5 transition-all outline-none"/>
                      </div>
                      <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">{t.phone}</label>
                        <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-precision-surface-lowest border-0 rounded-2xl py-5 px-6 text-sm font-bold text-secondary-900 shadow-spatial focus:ring-4 focus:ring-primary-600/5 transition-all outline-none"/>
                      </div>
                      <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">{t.general_observations}</label>
                        <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} rows={6} className="w-full bg-precision-surface-lowest border-0 rounded-2xl py-5 px-6 text-sm font-bold text-secondary-900 shadow-spatial focus:ring-4 focus:ring-primary-600/5 transition-all outline-none resize-none" placeholder="Alergias, condiciones previas, antecedentes..."/>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                      <button onClick={handleSaveEdit} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all">{t.save}</button>
                      <button onClick={() => setIsEditing(false)} className="px-10 bg-surface-container-low text-secondary-400 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">{t.cancel}</button>
                    </div>
                  </div>
                ) : activeTab === 'historia' ? (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* EHR Input Area */}
                    <div className="bg-precision-surface-lowest p-8 rounded-3xl shadow-spatial space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary-600/10 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary-600" />
                        </div>
                        <h4 className="text-xs font-black text-secondary-900 uppercase tracking-widest">New Clinical Entry</h4>
                      </div>
                      <textarea 
                        value={newRecordText}
                        onChange={e => setNewRecordText(e.target.value)}
                        placeholder="Escribe la evolución, diagnóstico o notas de la sesión..."
                        className="w-full bg-surface-container-low border-0 rounded-2xl p-6 text-sm font-bold text-secondary-900 focus:ring-4 focus:ring-primary-600/5 outline-none resize-none min-h-[150px] placeholder:text-secondary-300"
                      />
                      <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
                        <div>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png"/>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFiles}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-primary-600 transition-colors"
                          >
                            {uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin text-primary-600" /> : <Paperclip className="h-4 w-4" />}
                            Attach Files
                          </button>
                        </div>
                        <button 
                          onClick={handleSaveClinicalRecord}
                          disabled={isSavingRecord || !newRecordText.trim()}
                          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                          {isSavingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Save Record
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-8">
                      {clinicalRecords.length === 0 ? (
                        <div className="text-center py-20 bg-precision-surface-lowest rounded-3xl border border-dashed border-surface-container-low">
                          <p className="text-xs font-black text-secondary-200 uppercase tracking-widest">No medical records found.</p>
                        </div>
                      ) : (
                        <div className="space-y-10 relative before:absolute before:left-5 before:top-2 before:bottom-0 before:w-px before:bg-surface-container-low">
                          {clinicalRecords.map(record => (
                            <div key={record.id} className="relative pl-12 group/rec">
                              <div className="absolute left-4 top-2 h-2 w-2 rounded-full bg-primary-600 ring-4 ring-white z-10" />
                              <div className="bg-precision-surface-lowest p-8 rounded-3xl shadow-spatial border border-surface-container-low hover:border-primary-600/20 transition-all">
                                <header className="flex justify-between items-start mb-6 border-b border-surface-container-low pb-6">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                                      {format(parseISO(record.created_at), "d MMMM yyyy", { locale: dateLocale })}
                                    </p>
                                    <p className="text-xs font-bold text-secondary-400">
                                      {format(parseISO(record.created_at), "HH:mm'h'", { locale: dateLocale })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-[10px] font-black text-secondary-300 uppercase tracking-widest">Recorded by</p>
                                      <p className="text-xs font-black text-secondary-900 mt-0.5">{record.professionals?.full_name || 'System Admin'}</p>
                                    </div>
                                    {canEditRecord(record) && (
                                      <div className="flex gap-1">
                                        <button onClick={() => handleDeleteClinicalRecord(record.id)} className="p-2 hover:bg-red-50 text-secondary-300 hover:text-red-500 rounded-lg transition-colors">
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </header>
                                <p className="text-sm font-bold text-secondary-900 leading-relaxed whitespace-pre-wrap">{record.content}</p>
                                {record.attachments?.map((f: any, idx: number) => (
                                  <a key={idx} href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-surface-container-low rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 hover:bg-primary-600 hover:text-white transition-all">
                                    <Download className="h-3 w-3" /> {f.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* General Remarks */}
                    <section className="bg-precision-surface-lowest p-8 rounded-3xl shadow-spatial">
                      <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                        {t.general_observations}
                      </h4>
                      <div className="bg-surface-container-low rounded-2xl p-6 text-sm font-bold text-secondary-900 leading-relaxed border border-primary-600/5">
                        {parseMedicalNotes(selectedClient.notes).summary || (
                          <span className="text-secondary-300 italic">{t.no_remarks_yet}</span>
                        )}
                      </div>
                    </section>

                    {/* Stats & Actions */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 space-y-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.successful_appointments}</p>
                        <p className="text-4xl font-black text-emerald-900 tracking-tighter">
                          {clientApps.filter(a => a.status === 'completed' || a.status === 'confirmed').length}
                        </p>
                      </div>
                      <div className="bg-primary-600 p-8 rounded-3xl shadow-lg shadow-primary-600/20 text-white flex flex-col justify-between">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">History Management</p>
                        <button onClick={exportPatientHistory} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest pt-4 hover:translate-x-2 transition-transform">
                          {t.export_report} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Appointments Timeline */}
                    <section className="space-y-8">
                      <h4 className="text-xl font-black text-secondary-900 tracking-tight flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-primary-600" /> Appointment History
                      </h4>
                      <div className="space-y-6">
                        {clientApps.map(app => {
                          const st = statusLabel(app.status)
                          return (
                            <div key={app.id} className="bg-precision-surface-lowest p-6 rounded-2xl shadow-spatial border border-surface-container-low hover:border-primary-600/10 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${st.cls}`}>{st.text}</span>
                                  <h5 className="text-lg font-black text-secondary-900 group-hover:text-primary-600 transition-colors">{app.services?.name}</h5>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-secondary-900">
                                    {format(parseISO(app.start_at), "d MMM yyyy", { locale: dateLocale })}
                                  </p>
                                  <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                    {format(parseISO(app.start_at), "HH:mm'h'", { locale: dateLocale })}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-4 border-t border-surface-container-low flex justify-between items-center">
                                <p className="text-xs font-bold text-secondary-500 uppercase tracking-widest">
                                  <span className="text-secondary-300 font-black mr-2">With</span>
                                  {app.professionals?.full_name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

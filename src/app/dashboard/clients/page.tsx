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
      case 'awaiting_confirmation': return { text: t.awaiting, cls: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      case 'confirmed': return { text: t.confirmed, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'cancelled': return { text: t.canceled, cls: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'completed': return { text: t.confirmed, cls: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      default: return { text: s, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  }

  return (
    <div className="space-y-6 relative z-10">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">{t.patient_management}</h1>
        <p className="text-sm font-bold text-primary-200">{t.patient_management_subtitle}</p>
      </div>

      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-primary-400" />
        </div>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="block w-full rounded-2xl border border-white/10 bg-primary-900/40 backdrop-blur-md py-3 pl-11 pr-4 text-sm font-bold text-white placeholder-primary-300 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 shadow-sm outline-none transition-all"
          placeholder={t.search_patients_placeholder} 
        />
      </div>

      <div className="rounded-[2rem] bg-primary-900/40 backdrop-blur-md shadow-2xl border border-white/10 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-primary-300">
            <User className="mx-auto h-12 w-12 mb-3 opacity-50 text-accent-500" />
            <p className="text-sm font-bold uppercase tracking-widest">{t.no_patients_found}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredClients.map(c => (
              <button 
                key={c.id} 
                onClick={() => openClientDetail(c)}
                className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-800/50 border border-white/10 flex items-center justify-center text-accent-500 font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform">
                  {c.first_name.charAt(0)}{c.last_name?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs font-bold text-primary-300 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {c.phone}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary-400 group-hover:text-accent-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          {/* Header Full-width */}
          <div className="bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 text-white shadow-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setSelectedClient(null); setIsEditing(false); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 text-sm font-bold"
                >
                  <ArrowLeft className="h-5 w-5 text-accent-500" /> 
                  <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{t.back}</span>
                </button>
                <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-800/50 border border-white/10 flex items-center justify-center text-lg font-black text-accent-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    {selectedClient.first_name.charAt(0)}{selectedClient.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h3 className="text-xl font-black leading-none">{selectedClient.first_name} {selectedClient.last_name}</h3>
                    <p className="text-primary-300 text-xs flex items-center gap-1 mt-1.5 font-bold uppercase tracking-widest">
                      <Phone className="h-3 w-3" /> {selectedClient.phone}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={exportPatientHistory} 
                      className="bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-2 border border-white/10"
                    >
                      <Download className="h-4 w-4" /> {t.export_report}
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-primary-950 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      <Edit2 className="h-4 w-4" /> {t.edit}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                     <button onClick={handleSaveEdit} className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">{t.save}</button>
                     <button onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black">{t.cancel}</button>
                  </div>
                )}
                <button onClick={() => setSelectedClient(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-6 w-6 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-transparent relative z-10 custom-scrollbar">
            {/* Tabs Header */}
            {!isEditing && (
              <div className="bg-[#0B1120]/60 backdrop-blur-md border-b border-white/10 px-6 pt-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex gap-8">
                  <button 
                    onClick={() => setActiveTab('perfil')}
                    className={`pb-4 text-[10px] uppercase tracking-widest font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'perfil' ? 'border-accent-500 text-accent-500' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    <User className="h-4 w-4" /> Perfil & Turnos
                  </button>
                  <button 
                    onClick={() => setActiveTab('historia')}
                    className={`pb-4 text-[10px] uppercase tracking-widest font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'historia' ? 'border-accent-500 text-accent-500' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    <Stethoscope className="h-4 w-4" /> Historia Clínica (EHR)
                  </button>
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto p-6">
              {isEditing ? (
                <div className="max-w-2xl mx-auto bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-8 shadow-2xl border border-white/10">
                   <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2 tracking-tight">
                     <Edit2 className="h-5 w-5 text-accent-500" /> {t.edit_patient_data}
                   </h4>
                   <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-primary-300 uppercase tracking-widest mb-2">{t.name}</label>
                          <input type="text" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="block w-full rounded-2xl border-white/10 bg-primary-950/50 py-3 px-4 text-sm font-bold text-white focus:bg-primary-900 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all outline-none"/>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-primary-300 uppercase tracking-widest mb-2">{t.last_name}</label>
                          <input type="text" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="block w-full rounded-2xl border-white/10 bg-primary-950/50 py-3 px-4 text-sm font-bold text-white focus:bg-primary-900 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all outline-none"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-primary-300 uppercase tracking-widest mb-2">{t.phone}</label>
                        <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="block w-full rounded-2xl border-white/10 bg-primary-950/50 py-3 px-4 text-sm font-bold text-white focus:bg-primary-900 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all outline-none"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-primary-300 uppercase tracking-widest mb-2">{translations[lang].general_observations}</label>
                        <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} rows={6} className="block w-full rounded-2xl border-white/10 bg-primary-950/50 py-3 px-4 text-sm font-bold text-white focus:bg-primary-900 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all outline-none resize-none placeholder-primary-400/50" placeholder="Alergias, condiciones previas, antecedentes..."/>
                      </div>
                   </div>
                 </div>
              ) : activeTab === 'historia' ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* EHR Input Area */}
                  <div className="bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-6 shadow-2xl border border-white/10">
                    <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-accent-500" /> Nueva Entrada Médica
                    </h4>
                    <textarea 
                      value={newRecordText}
                      onChange={e => setNewRecordText(e.target.value)}
                      placeholder="Escribe la evolución, diagnóstico o notas de la sesión..."
                      className="w-full bg-primary-950/50 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-accent-500 focus:border-accent-500 outline-none resize-none min-h-[120px] placeholder-primary-400/50"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFiles}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-300 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                        >
                          {uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                          Adjuntar Archivo (PDF, Img)
                        </button>
                      </div>
                      <button 
                        onClick={handleSaveClinicalRecord}
                        disabled={isSavingRecord || !newRecordText.trim()}
                        className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isSavingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Guardar Registro
                      </button>
                    </div>
                  </div>

                  {/* EHR Timeline */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-accent-500" /> Historial Clínico Completo
                    </h4>
                    {clinicalRecords.length === 0 ? (
                      <div className="text-center py-16 bg-primary-900/20 rounded-[2rem] border border-dashed border-white/10">
                        <FileText className="mx-auto h-12 w-12 text-primary-400/50 mb-3" />
                        <p className="text-sm text-primary-300 font-bold uppercase tracking-widest">No hay registros médicos todavía.</p>
                      </div>
                    ) : (
                      <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-white/10">
                        {clinicalRecords.map(record => (
                          <div key={record.id} className="relative pl-14 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="absolute left-4 top-2 h-4 w-4 rounded-full bg-accent-500 border-4 border-[#0B1120] shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10" />
                            <div className="bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-6 shadow-lg border border-white/10 hover:border-accent-500/50 transition-colors group/rec">
                              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                <div>
                                  <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest">
                                    {format(parseISO(record.created_at), "d MMMM yyyy · HH:mm'h'", { locale: dateLocale })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none">Profesional</p>
                                    <p className="text-xs font-bold text-white mt-1">{record.professionals?.full_name || 'Admin'}</p>
                                  </div>
                                  {canEditRecord(record) && editingRecordId !== record.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/rec:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => { setEditingRecordId(record.id); setEditRecordText(record.content) }}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-primary-400 hover:text-accent-500 transition-colors"
                                        title={t.edit}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClinicalRecord(record.id)}
                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-primary-400 hover:text-red-400 transition-colors"
                                        title={t.delete}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingRecordId === record.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    autoFocus
                                    value={editRecordText}
                                    onChange={e => setEditRecordText(e.target.value)}
                                    className="w-full bg-primary-950/50 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-accent-500 focus:border-accent-500 outline-none resize-none min-h-[100px]"
                                    rows={4}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleEditClinicalRecord(record.id)}
                                      className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                    >
                                      {t.save}
                                    </button>
                                    <button
                                      onClick={() => setEditingRecordId(null)}
                                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all"
                                    >
                                      {t.cancel}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-primary-100 leading-relaxed whitespace-pre-wrap">{record.content}</p>
                              )}
                              
                              {record.attachments && record.attachments.length > 0 && editingRecordId !== record.id && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3">
                                  {record.attachments.map((file: any, idx: number) => (
                                    <a 
                                      key={idx} 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-accent-500/50 rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest font-black text-primary-200 hover:text-accent-500 transition-colors"
                                    >
                                      <Download className="h-3 w-3" /> {file.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Summary Info */}
                  <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                    {/* General Remarks (Allergies, History) - READ ONLY IN VIEW MODE */}
                    <div className="bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-6 shadow-lg border border-white/10">
                      <h4 className="text-[10px] font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <User className="h-4 w-4 text-accent-500" /> {translations[lang].general_observations}
                      </h4>
                      <div className="w-full bg-primary-950/50 rounded-2xl p-4 text-sm font-medium text-primary-100 border border-white/5 min-h-[100px] leading-relaxed">
                        {parseMedicalNotes(selectedClient.notes).summary || (
                          <span className="text-primary-400 italic">{translations[lang].no_remarks_yet}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-6 shadow-lg border border-white/10">
                      <h4 className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-4">{translations[lang].visit_summary}</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between">
                           <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">{t.successful_appointments}</p>
                           <p className="text-xl font-black text-emerald-300 leading-none">{clientApps.filter(a => a.status === 'completed' || a.status === 'confirmed').length}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20 flex items-center justify-between">
                           <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">{t.cancellations}</p>
                           <p className="text-xl font-black text-red-300 leading-none">{clientApps.filter(a => a.status === 'cancelled').length} </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Visit History */}
                  <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="bg-primary-900/40 backdrop-blur-md rounded-[2rem] p-8 shadow-lg border border-white/10 min-h-[60vh]">
                      <h4 className="text-lg font-black text-white mb-8 flex items-center gap-2 tracking-tight">
                        <Calendar className="h-5 w-5 text-accent-500" /> {translations[lang].clinical_history || 'Historial de Consultas'} ({clientApps.length})
                      </h4>
                      
                      {clientApps.length === 0 ? (
                        <div className="text-center py-20 bg-primary-900/20 rounded-[2rem] border border-dashed border-white/10">
                          <p className="text-sm text-primary-300 font-bold uppercase tracking-widest">{t.no_activity_today}</p>
                        </div>
                      ) : (
                        <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-white/10">
                           {clientApps.map(app => {
                             const st = statusLabel(app.status)
                             return (
                               <div key={app.id} className="relative pl-10 animate-in fade-in slide-in-from-left-4 duration-500">
                                 <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-[#0B1120] border-4 border-accent-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] z-10" />
                                 <div className="bg-primary-950/50 rounded-2xl p-5 border border-white/5 hover:border-accent-500/50 hover:bg-white/5 transition-all group">
                                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                     <div>
                                       <p className="text-md font-black text-white">{app.services?.name || 'N/A'}</p>
                                       <p className="text-[10px] font-bold text-primary-300 mt-1 uppercase tracking-widest">
                                         {format(parseISO(app.start_at), "d MMMM yyyy · HH:mm'h'", { locale: dateLocale })}
                                       </p>
                                     </div>
                                     <div className="flex items-center gap-3">
                                       <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${st.cls}`}>{st.text}</span>
                                       <div className="text-right hidden sm:block">
                                         <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none">{translations[lang].role_professional}</p>
                                         <p className="text-xs font-bold text-primary-100 mt-1">{app.professionals?.full_name}</p>
                                       </div>
                                     </div>
                                   </div>
                                   <div className="space-y-4">
                                     {/* Post List */}
                                     <div className="space-y-3">
                                       {parseAppEntries(app.notes).map((entry) => (
                                         <div key={entry.id} className="bg-primary-950/80 border border-white/5 rounded-2xl p-4 shadow-sm group/post">
                                           <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-2">
                                               <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">{translations[lang].medical_record}</span>
                                               <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">
                                                 {format(parseISO(entry.date), "HH:mm'h'", { locale: dateLocale })}
                                               </span>
                                             </div>
                                             <div className="flex items-center gap-1 opacity-0 group-hover/post:opacity-100 transition-opacity">
                                               <button 
                                                 onClick={() => { setEditingPostId(entry.id); setPostNoteEdit(entry.content); }}
                                                 className="p-1 hover:bg-white/10 rounded-md text-primary-400 hover:text-white transition-colors"
                                               >
                                                 <Edit2 className="h-3 w-3" />
                                               </button>
                                               <button 
                                                 onClick={() => handleDeleteAppPost(app.id, entry.id)}
                                                 className="p-1 hover:bg-red-500/20 rounded-md text-primary-400 hover:text-red-400 transition-colors"
                                               >
                                                 <X className="h-3 w-3" />
                                               </button>
                                             </div>
                                           </div>
                                           
                                           {editingPostId === entry.id ? (
                                             <div className="space-y-3">
                                               <textarea 
                                                 autoFocus
                                                 value={postNoteEdit} 
                                                 onChange={e => setPostNoteEdit(e.target.value)}
                                                 className="w-full text-sm p-3 bg-primary-900/50 border border-white/10 rounded-xl outline-none text-white resize-none"
                                                 rows={2}
                                               />
                                               <div className="flex gap-2">
                                                 <button onClick={() => handleSavePostEdit(app.id, entry.id)} className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]">{translations[lang].save}</button>
                                                 <button onClick={() => setEditingPostId(null)} className="text-primary-300 hover:text-white px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors">{translations[lang].cancel}</button>
                                               </div>
                                             </div>
                                           ) : (
                                             <p className="text-sm text-primary-100 font-medium leading-relaxed">{entry.content}</p>
                                           )}
                                         </div>
                                       ))}
                                     </div>

                                     {/* Add New Post Box */}
                                     <div className="bg-white/5 rounded-2xl p-4 border border-dashed border-white/10">
                                       <textarea
                                         value={editingAppId === app.id ? appNoteEdit : ''}
                                         onFocus={() => setEditingAppId(app.id)}
                                         onChange={e => setAppNoteEdit(e.target.value)}
                                         placeholder={translations[lang].add_comment_placeholder}
                                         className="w-full bg-transparent text-sm font-medium text-white border-none focus:ring-0 resize-none placeholder-primary-400 min-h-[40px] leading-relaxed outline-none"
                                         rows={editingAppId === app.id ? 3 : 1}
                                       />
                                       {editingAppId === app.id && (
                                         <div className="flex justify-end mt-2 gap-2">
                                           <button
                                             onClick={() => handleAddAppPost(app.id)}
                                             disabled={isSavingAppNote || !appNoteEdit.trim()}
                                             className="bg-accent-500 hover:bg-accent-400 text-primary-950 px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                           >
                                             {isSavingAppNote ? '...' : translations[lang].save_note}
                                           </button>
                                           <button onClick={() => setEditingAppId(null)} className="text-primary-300 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-black px-3">{translations[lang].cancel}</button>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             )
                           })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

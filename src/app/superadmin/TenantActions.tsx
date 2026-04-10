'use client'

import { useState, useEffect } from 'react'
import { toggleSuspendTenantAction, getTenantStats, deleteTenantAction } from './actions'
import {
  PowerOff, Power, ExternalLink, Loader2, X, Users, CalendarCheck,
  Stethoscope, Scissors, Trash2, Mail, KeyRound, CreditCard, Smartphone,
  Save, Eye, EyeOff, CheckCircle2, Copy, Check, Link, Plus, Trash
} from 'lucide-react'

function getPaymentMock(id: string) {
  return { status: 'Al día', color: 'emerald' }
}

interface Tenant {
  id: string
  name: string
  slug: string
  settings?: { suspended?: boolean; specialty?: string; language?: string; admin_email?: string }
}

interface WhatsAppAccount {
  id: string;
  phone_number_id: string;
  access_token: string;
  label: string;
}

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'whatsapp'>('overview')

  // Whapi.Cloud config state (Multiple Accounts)
  const [waAccounts, setWaAccounts] = useState<WhatsAppAccount[]>([])
  const [isSavingWA, setIsSavingWA] = useState(false)
  const [waMessage, setWaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showTokenFor, setShowTokenFor] = useState<string | null>(null)
  const [copiedFor, setCopiedFor] = useState<string | null>(null)

  // New account form state
  const [newAcc, setNewAcc] = useState({ phone_number_id: '', access_token: '', label: '' })

  const isSuspended = tenant.settings?.suspended === true
  const payment = getPaymentMock(tenant.id)
  const [webhookUrl, setWebhookUrl] = useState('')
  
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/whatsapp`)
  }, [])

  async function handleSuspend() {
    setLoading(true)
    await toggleSuspendTenantAction(tenant.id, isSuspended)
    setLoading(false)
  }

  async function handleDetails() {
    setDetailsOpen(true)
    setActiveTab('overview')
    setLoadingStats(true)
    const data = await getTenantStats(tenant.id)
    setStats(data)
    setLoadingStats(false)
    loadWhatsAppAccounts()
  }

  async function loadWhatsAppAccounts() {
    try {
      const res = await fetch(`/api/settings/whatsapp?tenant_id=${tenant.id}`)
      if (res.ok) {
        const data = await res.json()
        setWaAccounts(data)
      }
    } catch {}
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await deleteTenantAction(tenant.id)
    setDeleting(false)
  }

  async function handleSaveWA(e: React.FormEvent, existingId?: string) {
    if (e) e.preventDefault()
    setIsSavingWA(true)
    setWaMessage(null)
    
    const payload = existingId 
      ? waAccounts.find(a => a.id === existingId)
      : newAcc;

    if (!payload?.phone_number_id || !payload?.access_token) {
      setWaMessage({ text: 'Completa todos los campos', type: 'error' });
      setIsSavingWA(false);
      return;
    }

    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          tenant_id: tenant.id
        })
      })
      if (res.ok) {
        setWaMessage({ text: '¡Configuración guardada!', type: 'success' })
        if (!existingId) setNewAcc({ phone_number_id: '', access_token: '', label: '' })
        loadWhatsAppAccounts()
      } else {
        const err = await res.json()
        setWaMessage({ text: err.error || 'Error al guardar', type: 'error' })
      }
    } catch {
      setWaMessage({ text: 'Error de conexión', type: 'error' })
    }
    setIsSavingWA(false)
  }

  async function deleteAccount(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este número?')) return;
    try {
      const res = await fetch(`/api/settings/whatsapp?id=${id}&tenant_id=${tenant.id}`, { method: 'DELETE' })
      if (res.ok) loadWhatsAppAccounts()
    } catch {}
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedFor('webhook')
    setTimeout(() => setCopiedFor(null), 2000)
  }

  const paymentColors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <>
      {/* (Previous UI remains same for brevity, but I will provide the FULL file) */}
      <div className="mt-4 relative z-10">
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider ${paymentColors[payment.color]}`}>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" />
            <span>Cuenta: {payment.status}</span>
          </div>
          {payment.due && <span>Vence: {payment.due}</span>}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#222] relative z-10 flex gap-2">
        <button onClick={handleSuspend} disabled={loading} className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${isSuspended ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'}`}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : isSuspended ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
          {isSuspended ? 'Reactivar' : 'Suspender'}
        </button>
        <button onClick={handleDetails} className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-xl border border-amber-500/20 transition-colors flex items-center gap-1.5">
          Detalles <ExternalLink className="h-3 w-3" />
        </button>
        <button onClick={handleDelete} disabled={deleting} onBlur={() => setConfirmDelete(false)} className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${confirmDelete ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:text-red-400 hover:border-red-500/30'}`}>
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          {confirmDelete ? '¿Seguro?' : ''}
        </button>
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111] border border-[#222] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <div>
                <h2 className="text-xl font-black text-white">{tenant.name}</h2>
                <span className="text-xs text-amber-500 uppercase tracking-widest font-bold">{tenant.settings?.specialty}</span>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex border-b border-[#222]">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === 'overview' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>
                Resumen y Diagnóstico
              </button>
              <button onClick={() => setActiveTab('whatsapp')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'whatsapp' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>
                <Smartphone className="h-3.5 w-3.5" /> WhatsApp [{waAccounts.length}]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-10 pb-10">
                  {stats ? (
                    <>
                      {/* Subscription & Access */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-[#1a1a1a] border border-[#222]">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <CreditCard className="h-3 w-3 text-amber-500" /> Suscripción
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                              stats.tenant?.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {stats.tenant?.subscription_status}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {stats.tenant?.trial_ends_at ? `Fin Trial: ${new Date(stats.tenant.trial_ends_at).toLocaleDateString()}` : 'Sin Trial'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-[#1a1a1a] border border-[#222]">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Mail className="h-3 w-3 text-blue-500" /> Admin Access
                          </p>
                          <p className="text-xs font-mono text-white truncate" title={stats.adminEmail}>{stats.adminEmail}</p>
                        </div>
                      </div>

                      {/* Counters */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-5 rounded-3xl bg-[#1a1a1a] border border-[#222] text-center">
                          <div className="text-2xl font-black text-white">{stats.clientCount}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-black mt-1">Pacientes</div>
                        </div>
                        <div className="p-5 rounded-3xl bg-[#1a1a1a] border border-[#222] text-center">
                          <div className="text-2xl font-black text-white">{stats.appointmentCount}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-black mt-1">Citas</div>
                        </div>
                        <div className="p-5 rounded-3xl bg-[#1a1a1a] border border-[#222] text-center">
                          <div className="text-2xl font-black text-white">{stats.professionals.length}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-black mt-1">Drs</div>
                        </div>
                      </div>

                      {/* Recent Appointments */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-3">Últimas Citas</h4>
                        <div className="space-y-2">
                          {stats.lastAppointments.length > 0 ? stats.lastAppointments.map((app: any) => (
                            <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#222] text-xs">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{app.clients?.first_name} {app.clients?.last_name}</span>
                                <span className="text-[10px] text-gray-600">{new Date(app.start_at).toLocaleString()}</span>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                app.status === 'confirmed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-500 bg-gray-500/10'
                              }`}>{app.status}</span>
                            </div>
                          )) : <p className="text-[10px] text-gray-600 italic">No hay citas registradas</p>}
                        </div>
                      </div>

                      {/* Recent Clients */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-l-2 border-blue-500 pl-3">Pacientes Recientes</h4>
                        <div className="space-y-2">
                          {stats.lastClients.length > 0 ? stats.lastClients.map((client: any) => (
                            <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#222] text-xs">
                              <span className="text-white font-bold">{client.first_name} {client.last_name}</span>
                              <span className="text-[10px] text-gray-600 font-mono">{client.phone || 'Sin tel'}</span>
                            </div>
                          )) : <p className="text-[10px] text-gray-600 italic">No hay pacientes registrados</p>}
                        </div>
                      </div>

                      {/* Services & Professionals Summary */}
                      <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Servicios</h4>
                           <div className="space-y-1">
                              {stats.services.map((s: any) => (
                                <div key={s.id} className="text-[10px] text-gray-400 flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-gray-700" /> {s.name}
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Profesionales</h4>
                           <div className="space-y-1">
                              {stats.professionals.map((p: any) => (
                                <div key={p.id} className="text-[10px] text-gray-400 flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-gray-700" /> {p.full_name}
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>

                      {/* Debug: Raw Settings JSON */}
                      <div className="pt-8 border-t border-[#222]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Debug: Raw Settings JSON</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-red-500/10 font-mono text-[10px] text-gray-500 overflow-x-auto">
                          <pre>{JSON.stringify(stats.tenant?.settings, null, 2)}</pre>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                       <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Compilando datos de diagnóstico...</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="space-y-8">
                  {/* Current Accounts */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Canales Configurados</h4>
                    {waAccounts.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">No hay números configurados para esta clínica.</p>
                    ) : (
                      <div className="grid gap-3">
                        {waAccounts.map(acc => (
                          <div key={acc.id} className="p-4 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
                                <Smartphone className="h-5 w-5 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-none">{acc.label}</p>
                                <p className="text-[10px] font-mono text-gray-600 mt-1">{acc.phone_number_id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => deleteAccount(acc.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Header */}
                  <div className="pt-6 border-t border-[#222]">
                    <div className="flex items-center gap-2 mb-4">
                      <Plus className="h-4 w-4 text-emerald-500" />
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agregar Nuevo Número</h4>
                    </div>
                    
                    <form onSubmit={(e) => handleSaveWA(e)} className="grid gap-4 bg-black/40 p-6 rounded-3xl border border-[#222]">
                       <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 pl-1">Etiqueta (Ej: Matriz, Sucursal Norte)</label>
                          <input
                            type="text"
                            value={newAcc.label}
                            onChange={e => setNewAcc({...newAcc, label: e.target.value})}
                            placeholder="Etiqueta"
                            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 pl-1">Channel ID (Whapi)</label>
                          <input
                            type="text"
                            value={newAcc.phone_number_id}
                            onChange={e => setNewAcc({...newAcc, phone_number_id: e.target.value})}
                            placeholder="WH-..."
                            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-amber-500"
                          />
                        </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 pl-1">API Token (Access Token)</label>
                          <div className="relative">
                            <input
                              type={showTokenFor === 'new' ? "text" : "password"}
                              value={newAcc.access_token}
                              onChange={e => setNewAcc({...newAcc, access_token: e.target.value})}
                              placeholder="Access Token"
                              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-amber-500 pr-12"
                            />
                            <button type="button" onClick={() => setShowTokenFor(showTokenFor === 'new' ? null : 'new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-amber-500">
                              {showTokenFor === 'new' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {waMessage && (
                          <div className={`p-4 rounded-xl text-[10px] font-bold border ${waMessage.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {waMessage.text}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSavingWA}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                        >
                          {isSavingWA ? 'Guardando...' : 'Registrar Canal WhatsApp'}
                        </button>
                    </form>
                  </div>

                  {/* Webhook Help */}
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Link className="h-3.5 w-3.5 text-amber-500" /> Webhook Callback URL
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/40 py-3 px-4 rounded-xl text-[11px] font-mono text-gray-400 break-all border border-[#333]">
                        {webhookUrl}
                      </div>
                      <button onClick={copyWebhook} className="h-10 w-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center hover:border-amber-500 transition-all">
                        {copiedFor === 'webhook' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

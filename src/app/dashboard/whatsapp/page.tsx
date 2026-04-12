"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Smartphone, Zap, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, ArrowRight, ShieldCheck, Sparkles, PartyPopper } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { translations, Language } from '@/lib/i18n'

export default function WhatsAppPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const successParam = searchParams.get('success')
  
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [lang, setLang] = useState<Language>('es')
  const [isProcessing, setIsProcessing] = useState(false)
  const [forceSuccess, setForceSuccess] = useState(false)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccount, setNewAccount] = useState({ label: '', phone_number_id: '', access_token: '' })
  const [formError, setFormError] = useState('')

  const t = (translations[lang] || translations['es']) as any

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tuData } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .single()

      if (tuData?.tenants) {
        const tenantData = tuData.tenants as any
        setTenant(tenantData)
        setLang((tenantData.settings?.language as Language) || 'es')
        
        // Fetch WhatsApp accounts if active
        if (tenantData.subscription_status === 'active' || forceSuccess || successParam === 'true') {
          const res = await fetch(`/api/settings/whatsapp?tenant_id=${tenantData.id}`)
          const data = await res.json()
          setAccounts(data)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [forceSuccess, successParam])

  const handleUpgrade = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error al iniciar pago: ' + (data.error || 'Desconocido'))
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!newAccount.phone_number_id || !newAccount.access_token) {
      setFormError('ID y Token son obligatorios')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccount, tenant_id: tenant.id })
      })
      const data = await res.json()
      if (data.success) {
        setNewAccount({ label: '', phone_number_id: '', access_token: '' })
        setShowAddForm(false)
        fetchData()
      } else {
        setFormError(data.error || 'Error al guardar')
      }
    } catch (error) {
      setFormError('Error de red')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('¿Eliminar este canal?')) return
    try {
      await fetch(`/api/settings/whatsapp?id=${id}&tenant_id=${tenant.id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      alert('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  // --- SUCCESS MOCKUP SCREEN ---
  if (successParam === 'true' && !forceSuccess) {
    return (
      <div className="flex-1 p-4 md:p-12 min-h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-700">
        <div className="max-w-xl w-full text-center space-y-6 md:space-y-8 bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
          {/* Success Decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-400" />
          
          <div className="relative">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 mb-6 animate-bounce">
              <PartyPopper className="h-12 w-12" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-amber-500 animate-pulse" />
          </div>

          <div className="space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              ¡Pago <span className="text-emerald-500">Exitoso</span>!
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-bold leading-relaxed">
              Tu suscripción **SchedAssist Premium** está activa. Ahora puedes vincular tus números de WhatsApp y activar el asistente de IA.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-left">
            <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Mensual $70 (Acceso Ilimitado)</p>
                </div>
            </div>
            <div className="h-px bg-slate-200 dark:bg-white/10 w-full my-4" />
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Próximo cobro</span>
                <span className="text-slate-900 dark:text-white">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setForceSuccess(true)
              router.replace('/dashboard/whatsapp')
            }}
            className="w-full h-16 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            Configurar WhatsApp Ahora <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // --- GATE SCREEN (NOT ACTIVE) ---
  if (tenant?.subscription_status !== 'active' && !forceSuccess && successParam !== 'true') {
    return (
      <div className="flex-1 p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-slate-900 border border-white/10 shadow-2xl">
            {/* Background Magic */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
              <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 p-8 md:p-20 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-amber-500 mb-8 shadow-xl shadow-amber-500/20">
                <Zap className="h-10 w-10 text-slate-900 fill-slate-900/50" />
              </div>
              
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4 md:mb-6 leading-none">
                WhatsApp <span className="text-amber-500">Premium</span>
              </h1>
              
              <p className="text-base md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed">
                {t.whatsapp_banner.desc}
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                {[
                  { title: t.bot_ai || 'IA Conversacional', desc: t.whatsapp_feature_1 || 'Bots inteligentes que agendan por ti.' },
                  { title: t.multichannel || 'Multicanal Real', desc: t.whatsapp_feature_2 || 'Usa múltiples números si lo necesitas.' },
                  { title: t.security || 'Seguridad Total', desc: t.whatsapp_feature_3 || 'Tus datos y los de tus pacientes, protegidos.' }
                ].map((feature, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mb-3" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">{feature.title}</h3>
                    <p className="text-xs text-slate-500 leading-normal">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button 
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full md:w-auto px-10 py-5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-3xl font-black text-lg uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <>{t.whatsapp_banner.cta} por $70/mes <ArrowRight className="h-5 w-5" /></>}
                </button>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> {t.secure_payment || 'Pago Seguro vía Stripe'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- ACTIVE CONFIGURATION ---
  return (
    <div className="flex-1 p-4 md:p-12 space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
              Suscripción Activa
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            {t.whatsapp_config || 'Configuración'} <span className="text-amber-500">WhatsApp</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full md:w-auto px-6 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[1.25rem] md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          {showAddForm ? t.cancel : <><Plus className="h-4 w-4" /> {t.link_new_number || 'Vincular Nuevo Número'}</>}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 animate-in zoom-in-95 duration-300">
          <form onSubmit={handleAddAccount} className="max-w-xl space-y-6 md:space-y-8">
            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3 px-1">Etiqueta (Ej: Recepción)</label>
                <input 
                  type="text" 
                  value={newAccount.label}
                  onChange={e => setNewAccount({...newAccount, label: e.target.value})}
                  className="w-full h-12 md:h-14 bg-white dark:bg-black rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 px-4 md:px-6 font-bold text-slate-900 dark:text-white transition-all focus:border-amber-500 outline-none text-sm md:text-base"
                  placeholder="Nombre del canal..." 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3 px-1">Channel ID (Whapi)</label>
                  <input 
                    type="text" 
                    required
                    value={newAccount.phone_number_id}
                    onChange={e => setNewAccount({...newAccount, phone_number_id: e.target.value})}
                    className="w-full h-12 md:h-14 bg-white dark:bg-black rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 px-4 md:px-6 font-bold text-slate-900 dark:text-white transition-all focus:border-amber-500 outline-none text-sm md:text-base"
                    placeholder="THOROD-..." 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3 px-1">API Token</label>
                  <input 
                    type="password" 
                    required
                    value={newAccount.access_token}
                    onChange={e => setNewAccount({...newAccount, access_token: e.target.value})}
                    className="w-full h-12 md:h-14 bg-white dark:bg-black rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 px-4 md:px-6 font-bold text-slate-900 dark:text-white transition-all focus:border-amber-500 outline-none text-sm md:text-base"
                    placeholder="••••••••" 
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className="h-16 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : t.btnSave || 'Guardar Configuración'}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {accounts.length === 0 ? (
          <div className="p-12 text-center rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
            <Smartphone className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aún no has vinculado ningún número de WhatsApp.</p>
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="group p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-black border border-slate-200 dark:border-white/10 hover:border-amber-500/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-xl hover:shadow-amber-500/5">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-amber-500 transition-colors duration-300 shadow-inner flex-shrink-0">
                  <Smartphone className="h-7 w-7 md:h-8 md:w-8 text-slate-400 dark:text-white/40 group-hover:text-slate-900 transition-colors duration-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{acc.label}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                    <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 truncate max-w-[120px]">ID: {acc.phone_number_id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Conectado</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="h-12 w-12 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-500/30 flex items-center justify-center transition-all bg-white dark:bg-black"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-1">Nota sobre Whapi</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">Asegúrate de que tu canal en el panel de Whapi.Cloud esté en estado <span className="text-emerald-500 font-bold uppercase">Authed</span>. Puedes vincular múltiples canales para mayor redundancia.</p>
        </div>
      </div>
    </div>
  )
}

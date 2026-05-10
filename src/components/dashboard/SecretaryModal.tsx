'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, User, Mail, Loader2, CheckCircle, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface SecretaryModalProps {
  tenantId: string
  onClose: () => void
  onSuccess: () => void
  lang?: string
}

interface CreatedCredentials {
  auth_email: string
  auth_password: string
}

export function SecretaryModal({ tenantId, onClose, onSuccess, lang = 'es' }: SecretaryModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCredentials | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const labels = {
    es: {
      title: 'Nueva',
      subtitle: 'Secretaria',
      badge: 'Control de Acceso',
      name_label: 'Nombre Completo',
      email_label: 'Email Institucional / Personal',
      email_hint: 'Se usará para el acceso al sistema',
      phone_label: 'Celular / WhatsApp',
      phone_ph: '+54 9 11 ...',
      create: 'Crear Acceso',
      cancel: 'Cancelar',
      success_title: 'Acceso Creado',
      success_desc: 'Compartí estas credenciales de forma segura',
      done: 'Finalizar',
      copy_hint: 'Copiado',
      name_ph: 'Nombre Apellido',
      email_ph: 'usuario@clinica.com',
    },
    en: {
      title: 'New',
      subtitle: 'Secretary',
      badge: 'Access Control',
      name_label: 'Full Name',
      email_label: 'Institutional / Personal Email',
      email_hint: 'Will be used for system access',
      phone_label: 'Mobile / WhatsApp',
      phone_ph: '+1 ...',
      create: 'Create Access',
      cancel: 'Cancel',
      success_title: 'Access Created',
      success_desc: 'Share these credentials securely',
      done: 'Done',
      copy_hint: 'Copied',
      name_ph: 'First Last',
      email_ph: 'user@clinic.com',
    },
    it: {
      title: 'Nuova',
      subtitle: 'Segretaria',
      badge: 'Controllo Accesso',
      name_label: 'Nome Completo',
      email_label: 'Email Istituzionale / Personale',
      email_hint: 'Verrà utilizzato per l\'accesso al sistema',
      phone_label: 'Cellulare / WhatsApp',
      phone_ph: '+39 ...',
      create: 'Crea Accesso',
      cancel: 'Annulla',
      success_title: 'Accesso Creato',
      success_desc: 'Condividi queste credenziali in modo sicuro',
      done: 'Fine',
      copy_hint: 'Copiato',
      name_ph: 'Nome Cognome',
      email_ph: 'utente@clinica.com',
    }
  }

  const t = labels[lang as keyof typeof labels] || labels['es']

  async function handleCreate() {
    if (!fullName.trim() || !email.trim() || !phone.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/secretary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creating secretary')
      setCreated({ auth_email: data.auth_email, auth_password: data.auth_password })
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard(text: string, field: 'email' | 'password') {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 35, stiffness: 350 }}
        className="relative h-full w-full max-w-md bg-surface shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.4em] text-on-surface/40 uppercase">
                {t.badge}
              </span>
            </div>
            <h2 className="text-3xl font-black text-on-surface tracking-tighter leading-tight uppercase">
              {t.title} <br />
              <span className="text-amber-500 italic font-serif lowercase pr-2">{t.subtitle}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-on-surface/5 rounded-full transition-colors group"
          >
            <X className="h-5 w-5 text-on-surface/40 group-hover:text-on-surface transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!created ? (
            <>
              {/* Info banner */}
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  {lang === 'es'
                    ? 'La secretaria tendrá acceso a turnos, pacientes y servicios. No podrá ver configuración, facturación ni estadísticas.'
                    : lang === 'it'
                    ? 'La segretaria avrà accesso a appuntamenti, pazienti e servizi. Non potrà vedere configurazione, fatturazione o statistiche.'
                    : 'The secretary will have access to appointments, patients and services. They cannot see settings, billing or analytics.'}
                </p>
              </div>

              {/* Name field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                  {t.name_label}
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20 group-focus-within:text-amber-400 transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder={t.name_ph}
                    className="w-full h-14 bg-on-surface/[0.03] border border-on-surface/10 pl-14 pr-5 font-bold text-sm text-on-surface focus:ring-4 focus:ring-amber-400/10 focus:border-amber-400 transition-all outline-none rounded-2xl"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                  {t.email_label}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface/20 group-focus-within:text-amber-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.email_ph}
                    className="w-full h-14 bg-on-surface/[0.03] border border-on-surface/10 pl-14 pr-5 font-bold text-sm text-on-surface focus:ring-4 focus:ring-amber-400/10 focus:border-amber-400 transition-all outline-none rounded-2xl"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                  {(t as any).phone_label}
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="text-[10px] font-black text-on-surface/20">#</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={(t as any).phone_ph}
                    className="w-full h-14 bg-on-surface/[0.03] border border-on-surface/10 pl-14 pr-5 font-bold text-sm text-on-surface focus:ring-4 focus:ring-amber-400/10 focus:border-amber-400 transition-all outline-none rounded-2xl"
                  />
                </div>
                <p className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest ml-1">
                  {t.email_hint}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-4 items-center"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </motion.div>
              )}
            </>
          ) : (
            /* Credentials display */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-6">
                <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <CheckCircle className="h-10 w-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-on-surface uppercase tracking-tighter">{t.success_title}</h3>
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-1">{t.success_desc}</p>
              </div>

              {/* Email credential */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">Email</label>
                <div className="flex items-center gap-3 p-4 bg-on-surface/[0.03] border border-on-surface/10 rounded-2xl">
                  <code className="flex-1 text-sm font-bold text-on-surface truncate">{created.auth_email}</code>
                  <button
                    onClick={() => copyToClipboard(created.auth_email, 'email')}
                    className="p-2 hover:bg-on-surface/5 rounded-xl transition-colors flex-shrink-0"
                  >
                    {copied === 'email'
                      ? <CheckCircle className="h-4 w-4 text-amber-500" />
                      : <Copy className="h-4 w-4 text-on-surface/40" />
                    }
                  </button>
                </div>
              </div>

              {/* Password credential */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest ml-1">
                  {lang === 'es' ? 'Contraseña' : lang === 'it' ? 'Password' : 'Password'}
                </label>
                <div className="flex items-center gap-3 p-4 bg-on-surface/[0.03] border border-on-surface/10 rounded-2xl">
                  <code className="flex-1 text-sm font-bold text-on-surface">
                    {showPassword ? created.auth_password : '••••••••'}
                  </code>
                  <button
                    onClick={() => setShowPassword(v => !v)}
                    className="p-2 hover:bg-on-surface/5 rounded-xl transition-colors flex-shrink-0"
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4 text-on-surface/40" />
                      : <Eye className="h-4 w-4 text-on-surface/40" />
                    }
                  </button>
                  <button
                    onClick={() => copyToClipboard(created.auth_password, 'password')}
                    className="p-2 hover:bg-on-surface/5 rounded-xl transition-colors flex-shrink-0"
                  >
                    {copied === 'password'
                      ? <CheckCircle className="h-4 w-4 text-amber-500" />
                      : <Copy className="h-4 w-4 text-on-surface/40" />
                    }
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  {lang === 'es'
                    ? 'Guardá estas credenciales ahora. No se podrán recuperar después de cerrar esta ventana.'
                    : lang === 'it'
                    ? 'Salva queste credenziali ora. Non potranno essere recuperate dopo la chiusura di questa finestra.'
                    : 'Save these credentials now. They cannot be recovered after closing this window.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-on-surface/5 bg-surface/80 backdrop-blur-md">
          {!created ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-14 border border-on-surface/10 text-on-surface/50 font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-on-surface/5 transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !fullName.trim() || !email.trim() || !phone.trim()}
                className="flex-1 h-14 bg-amber-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full shadow-lg shadow-amber-400/20 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : t.create}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full h-14 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              {t.done}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

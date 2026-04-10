'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Smartphone, KeyRound, AlertCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { checkEnrollmentAction, enroll2faAction, verify2faAction } from './actions'

export default function TwoFactorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollData, setEnrollData] = useState<{ secret: string; otpauth: string } | null>(null)
  
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const check = async () => {
      const res = await checkEnrollmentAction()
      if (res.enrolled) {
        setIsEnrolled(true)
      } else if (res.secret) {
        setEnrollData({ secret: res.secret, otpauth: res.otpauth! })
      }
      setLoading(false)
    }
    check()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    
    setVerifying(true)
    setError(null)

    try {
      let res;
      if (!isEnrolled && enrollData) {
        res = await enroll2faAction(enrollData.secret, code)
      } else {
        res = await verify2faAction(code)
      }

      if (res.success) {
        router.push('/superadmin')
        router.refresh()
      } else {
        setError(res.error || 'Error de verificación')
        setVerifying(false)
      }
    } catch (err) {
      setError('Ocurrió un error inesperado')
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
        
        <div className="text-center">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Seguridad de Acceso</h1>
          <p className="text-gray-500 text-sm mt-2 font-bold uppercase tracking-widest">
            {isEnrolled ? 'Introduce tu código de 6 dígitos' : 'Configura Google Authenticator'}
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-[2.5rem] p-10 shadow-2xl">
          {!isEnrolled && enrollData && (
            <div className="mb-10 space-y-6 text-center">
              <div className="bg-white p-4 rounded-3xl inline-block mx-auto border-8 border-white">
                <QRCodeSVG value={enrollData.otpauth} size={180} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Código Secreto (Manual)</p>
                <code className="block bg-black py-3 px-4 rounded-xl text-xs font-mono text-gray-400 border border-[#333]">
                  {enrollData.secret}
                </code>
              </div>
              <p className="text-[9px] text-gray-500 uppercase font-black leading-relaxed">
                Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.) para comenzar.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">
                {isEnrolled ? 'Código de Verificación' : 'Código para Confirmar'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                autoFocus
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-black border border-[#333] rounded-2xl py-6 px-4 text-center text-4xl font-black tracking-[0.5em] text-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-gray-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-in shake duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full py-5 bg-white hover:bg-gray-200 disabled:opacity-50 text-black rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              {verifying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Verificar Acceso <KeyRound className="h-5 w-5" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[9px] text-gray-600 font-black uppercase tracking-tighter">
          SchedAssist Security Layer — Acceso Restringido
        </p>

      </div>
    </div>
  )
}

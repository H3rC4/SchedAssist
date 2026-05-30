"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO, startOfToday } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { translations, Language } from '@/lib/i18n'
import { hexToRgba } from '@/lib/utils'

import { useBookingData } from '@/hooks/useBookingData'
import { BookingHeader } from '@/components/booking/BookingHeader'
import { BookingWelcome } from '@/components/booking/BookingWelcome'
import { LocationSelector } from '@/components/booking/LocationSelector'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { ProfessionalSelector } from '@/components/booking/ProfessionalSelector'
import { DateTimePicker } from '@/components/booking/DateTimePicker'
import { ClientInfoForm } from '@/components/booking/ClientInfoForm'
import { BookingSuccess } from '@/components/booking/BookingSuccess'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { BookingBots } from '@/components/booking/BookingBots'
import { BookingLoading, BookingNotFound, BookingError } from '@/components/booking/BookingStates'
import { ProgressBar } from '@/components/booking/ProgressBar'
import { SkeletonCard, SkeletonCalendar, SkeletonSlots, SkeletonForm } from '@/components/booking/BookingSkeletons'

export default function BookingPage() {
  const params = useParams()
  const slug = params.slug as string

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [stepLoading, setStepLoading] = useState(false)

  // Pre-fill client info from localStorage (returning users)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`booking_client_${slug}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.firstName || parsed.phone) {
          setClientInfo(prev => ({
            ...prev,
            firstName: parsed.firstName || '',
            lastName: parsed.lastName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
          }))
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [slug])

  const {
    loading,
    tenant,
    locations,
    services,
    professionals,
    availableSlots,
    isBlocked,
    blockReason,
    selectedLocation,
    setSelectedLocation,
    errorType,
    slotsError,
    fetchSlots,
    handleBooking,
    retry
  } = useBookingData(slug)

  const primaryColor = tenant?.settings?.primary_color || '#005c55'
  const secondaryColor = tenant?.settings?.secondary_color || '#855300'

  const effectiveLang = (tenant?.settings?.language as Language) || 'es'
  const t = translations[effectiveLang] || translations['es']

  const loadSlots = async () => {
    if (!tenant || !selectedService || !selectedProfessional || !selectedDate) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    await fetchSlots(tenant.id, selectedProfessional.id, selectedService.id, dateStr)
  }

  const handleLocationSelect = (loc: any) => {
    setSelectedLocation(loc)
    setStep(2)
  }

  const handleServiceSelect = (serv: any) => {
    setSelectedService(serv)
    setStep(3)
  }

  const handleProfessionalSelect = async (prof: any) => {
    setSelectedProfessional(prof)
    setStep(4)
    setStepLoading(true)
    await loadSlots()
    setStepLoading(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot)
  }

  const handleClientInfoChange = (data: any) => {
    setClientInfo(data)
  }

  const onConfirmBooking = async () => {
    if (!tenant || !selectedService || !selectedProfessional || !selectedDate || !selectedSlot) return

    setBookingStatus('loading')

    const startAt = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`
    const duration = selectedService.duration_minutes || 30
    const endAtDate = new Date(parseISO(startAt).getTime() + duration * 60000)
    const endAt = format(endAtDate, "yyyy-MM-dd'T'HH:mm:ss")

    try {
      await handleBooking({
        tenantId: tenant.id,
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        locationId: selectedLocation?.id || null,
        startAt,
        endAt,
        firstName: clientInfo.firstName,
        lastName: clientInfo.lastName,
        email: clientInfo.email,
        phone: clientInfo.phone,
        notes: clientInfo.notes
      })
      // Save client info to localStorage for returning users
      try {
        localStorage.setItem(`booking_client_${slug}`, JSON.stringify({
          firstName: clientInfo.firstName,
          lastName: clientInfo.lastName,
          email: clientInfo.email,
          phone: clientInfo.phone,
        }))
      } catch {
        // Ignore localStorage errors
      }
      setBookingStatus('success')
    } catch (err) {
      console.error(err)
      setBookingStatus('error')
    }
  }

  const handleNewAppointment = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedProfessional(null)
    setSelectedSlot(null)
    setBookingStatus('idle')
  }

  if (loading) {
    return <BookingLoading primaryColor={primaryColor} />
  }

  if (errorType === 'not_found' || (!tenant && !errorType)) {
    return <BookingNotFound primaryColor={primaryColor} t={t} />
  }

  if (errorType && errorType !== 'not_found') {
    return <BookingError type={errorType} primaryColor={primaryColor} t={t} onRetry={retry} />
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 text-[#191c1e] relative overflow-hidden">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 opacity-[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" 
        style={{ backgroundColor: primaryColor }} 
      />

      <BookingHeader 
        tenant={tenant} 
        primaryColor={primaryColor} 
        secondaryColor={secondaryColor} 
        t={t} 
      />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 relative z-20">
        {bookingStatus === 'success' ? (
          <BookingSuccess
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            t={t}
            lang={effectiveLang}
            onNewAppointment={handleNewAppointment}
          />
        ) : (
          <div className="space-y-6">
            {step === 1 && (
              <BookingWelcome tenant={tenant} primaryColor={primaryColor} />
            )}

            <ProgressBar step={step} primaryColor={primaryColor} secondaryColor={secondaryColor} />

            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-card border border-on-surface/5 min-h-[400px] flex flex-col relative overflow-hidden">

              {/* STEP 1: LOCATION */}
              {step === 1 && (
                stepLoading ? <SkeletonCard count={3} /> : (
                <LocationSelector
                  locations={locations}
                  primaryColor={primaryColor}
                  onSelect={handleLocationSelect}
                  t={t}
                />
                )
              )}

              {/* STEP 2: SERVICE */}
              {step === 2 && (
                stepLoading ? <SkeletonCard count={4} /> : (
                <ServiceSelector
                  services={services}
                  primaryColor={primaryColor}
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelect={handleServiceSelect}
                  onBack={() => setStep(1)}
                  t={t}
                />
                )
              )}

              {/* STEP 3: PROFESSIONAL */}
              {step === 3 && (
                stepLoading ? <SkeletonCard count={3} /> : (
                <ProfessionalSelector
                  professionals={professionals}
                  primaryColor={primaryColor}
                  selectedLocation={selectedLocation}
                  onSelect={handleProfessionalSelect}
                  onBack={() => setStep(2)}
                  t={t}
                />
                )
              )}

              {/* STEP 4: DATE & TIME */}
              {step === 4 && (
                stepLoading ? (
                  <div className="space-y-8">
                    <SkeletonCalendar />
                    <SkeletonSlots />
                  </div>
                ) : slotsError ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.08) }}>
                      <AlertCircle className="h-7 w-7" style={{ color: primaryColor }} />
                    </div>
                    <p className="text-sm font-black text-[#191c1e] mb-1">{t.error_slots || 'No se pudieron cargar los horarios'}</p>
                    <p className="text-xs text-[#191c1e]/40 font-bold mb-6">{t.error_slots_desc || 'Ocurrió un error al buscar turnos disponibles.'}</p>
                    <button onClick={loadSlots} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95" style={{ backgroundColor: primaryColor }}>
                      <RefreshCw className="h-3.5 w-3.5" /> {t.retry || 'Intentar de nuevo'}
                    </button>
                  </div>
                ) : (
                <DateTimePicker
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  availableSlots={availableSlots}
                  isBlocked={isBlocked}
                  blockReason={blockReason}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  onSelectDate={handleDateSelect}
                  onSelectSlot={handleSlotSelect}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                  t={t}
                  lang={effectiveLang}
                />
                )
              )}

              {/* STEP 5: CLIENT INFO */}
              {step === 5 && (
                stepLoading ? <SkeletonForm /> : (
                <ClientInfoForm
                  clientInfo={clientInfo}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  selectedProfessional={selectedProfessional}
                  selectedService={selectedService}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  bookingStatus={bookingStatus}
                  onChange={handleClientInfoChange}
                  onBack={() => setStep(4)}
                  onConfirm={onConfirmBooking}
                  t={t}
                  lang={effectiveLang}
                />
                )
              )}
            </div>

            {step > 1 && (
              <BookingSummary
                step={step}
                selectedService={selectedService}
                selectedProfessional={selectedProfessional}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                t={t}
              />
            )}
          </div>
        )}
      </main>

      <BookingBots settings={tenant?.settings} lang={effectiveLang} tenantName={tenant?.name} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.03); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }
      `}</style>
    </div>
  )
}

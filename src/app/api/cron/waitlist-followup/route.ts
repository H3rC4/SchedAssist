import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { MessageService } from '@/services/message.service'

/**
 * Vercel Cron Job: Waitlist follow-up
 * Runs every 10 minutes. Finds expired waitlist offers and notifies the next patient in line.
 * Schedule: "*/10 * * * *"
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  console.log('--- [CRON] WAITLIST FOLLOW-UP INICIADO ---')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  // Find all notified entries where the offer has expired
  const { data: expiredOffers, error: expiredErr } = await supabase
    .from('waitlists')
    .select('*, clients(id, first_name, last_name, phone), professionals(id, full_name), tenants:tenant_id(settings)')
    .eq('status', 'notified')
    .lt('offer_expires_at', now)

  if (expiredErr) {
    console.error('[Waitlist Cron] Error fetching expired offers:', expiredErr)
    return NextResponse.json({ error: expiredErr.message }, { status: 500 })
  }

  if (!expiredOffers || expiredOffers.length === 0) {
    console.log('[Waitlist Cron] No expired offers found.')
    return NextResponse.json({ ok: true, processed: 0 })
  }

  console.log(`[Waitlist Cron] Found ${expiredOffers.length} expired offer(s).`)
  let nextNotified = 0

  for (const expired of expiredOffers) {
    try {
      const tenantSettings = (expired.tenants as any)?.settings || {}
      const lang = (tenantSettings.language as 'en' | 'es' | 'it') || 'es'
      const offerTimeoutMinutes: number = tenantSettings.waitlist_offer_timeout_minutes ?? 30
      const profName = expired.professionals?.full_name || ''

      // 1. Mark the expired entry as 'offer_expired'
      await supabase
        .from('waitlists')
        .update({ status: 'offer_expired', updated_at: now })
        .eq('id', expired.id)

      // Notify the expired patient that we moved on
      if (expired.clients?.phone) {
        const expiredClient = expired.clients
        const buildExpiredMsg = (firstName: string) => {
          if (lang === 'es') return `Hola ${firstName}, el tiempo para reclamar tu turno con *${profName}* expiró. Tu lugar pasó al siguiente paciente en lista. ¡Te avisaremos cuando haya otro turno disponible! 🙏`
          if (lang === 'it') return `Ciao ${firstName}, il tempo per prenotare il turno con *${profName}* è scaduto. Il posto è passato al prossimo paziente in lista. Ti avviseremo quando sarà disponibile un altro turno! 🙏`
          return `Hi ${firstName}, the time to claim your slot with *${profName}* expired. Your spot went to the next patient on the waitlist. We'll notify you when another slot opens! 🙏`
        }
        const isTg = expiredClient.phone.startsWith('tg_')
        try {
          await MessageService.sendMessage({
            channel: isTg ? 'telegram_gastro' : 'whatsapp',
            chat_id: isTg ? parseInt(expiredClient.phone.replace('tg_', '')) : expiredClient.phone,
            tenant_id: expired.tenant_id,
            text: buildExpiredMsg(expiredClient.first_name),
          })
        } catch (_) { /* non-critical */ }
      }

      // 2. Find the NEXT pending patient for the same professional + slot date
      if (!expired.offered_slot_start_at) continue

      const slotDate = format(parseISO(expired.offered_slot_start_at), 'yyyy-MM-dd')
      const slotTime = format(parseISO(expired.offered_slot_start_at), 'HH:mm')
      const slotDateFormatted = format(parseISO(expired.offered_slot_start_at), lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')

      const { data: nextInLine } = await supabase
        .from('waitlists')
        .select('*, clients(id, first_name, last_name, phone)')
        .eq('tenant_id', expired.tenant_id)
        .eq('professional_id', expired.professional_id)
        .eq('status', 'pending')
        .or(`preferred_date.eq.${slotDate},and(start_date.lte.${slotDate},end_date.gte.${slotDate})`)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!nextInLine || nextInLine.length === 0) {
        console.log(`[Waitlist Cron] No next patient for tenant ${expired.tenant_id}, slot ${slotDate}.`)
        continue
      }

      const next = nextInLine[0]
      const nextClient = next.clients
      if (!nextClient?.phone) continue

      const newOfferExpiresAt = new Date(Date.now() + offerTimeoutMinutes * 60 * 1000).toISOString()

      const buildMsg = (firstName: string) => {
        if (lang === 'es') return `¡Hola ${firstName}! 🗓️ Se liberó un turno con *${profName}* para el *${slotDateFormatted} a las ${slotTime}*.\n\n¡Tenés *${offerTimeoutMinutes} minutos* para tomarlo! Responde *SÍ* para confirmar o *NO* si no podés.`
        if (lang === 'it') return `Ciao ${firstName}! 🗓️ Si è liberato un appuntamento con *${profName}* per il *${slotDateFormatted} alle ${slotTime}*.\n\nHai *${offerTimeoutMinutes} minuti* per prenderlo! Rispondi *SÌ* per confermare o *NO* se non puoi.`
        return `Hi ${firstName}! 🗓️ A slot with *${profName}* opened up for *${slotDateFormatted} at ${slotTime}*.\n\nYou have *${offerTimeoutMinutes} minutes* to claim it! Reply *YES* to confirm or *NO* if you can't make it.`
      }

      const isTgNext = nextClient.phone.startsWith('tg_')
      await MessageService.sendMessage({
        channel: isTgNext ? 'telegram_gastro' : 'whatsapp',
        chat_id: isTgNext ? parseInt(nextClient.phone.replace('tg_', '')) : nextClient.phone,
        tenant_id: expired.tenant_id,
        text: buildMsg(nextClient.first_name),
        buttons: lang === 'es' ? ['✅ SÍ', '❌ NO'] : (lang === 'it' ? ['✅ SÌ', '❌ NO'] : ['✅ YES', '❌ NO']),
      })

      // Update next entry to notified
      await supabase
        .from('waitlists')
        .update({
          status: 'notified',
          notified_at: now,
          offer_expires_at: newOfferExpiresAt,
          offered_slot_start_at: expired.offered_slot_start_at,
          updated_at: now,
        })
        .eq('id', next.id)

      nextNotified++
      console.log(`[Waitlist Cron] Next patient notified: ${nextClient.first_name} ${nextClient.last_name} for slot ${slotDate}.`)

    } catch (err) {
      console.error(`[Waitlist Cron] Error processing expired offer ${expired.id}:`, err)
    }
  }

  console.log(`--- [Waitlist Cron] FINALIZADO. Expirados: ${expiredOffers.length}, Siguientes notificados: ${nextNotified} ---`)
  return NextResponse.json({ ok: true, expired: expiredOffers.length, next_notified: nextNotified })
}

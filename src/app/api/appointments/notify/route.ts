import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MessageService } from '@/services/message.service'
import { verifyTenantAccess } from '@/lib/auth-utils'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales } from '@/lib/i18n'

export async function POST(req: NextRequest) {
  try {
    const { appointment_id, tenant_id } = await req.json()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const access = await verifyTenantAccess(supabase, user, tenant_id)
    
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // Fetch appointment with all details
    const { data: app, error: appError } = await supabase
      .from('appointments')
      .select(`
        id, 
        start_at, 
        status,
        clients(first_name, phone, whatsapp_opt_in),
        services(name),
        tenants(name, settings)
      `)
      .eq('id', appointment_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (appError || !app) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (app.status !== 'cancelled') {
      return NextResponse.json({ error: 'Only cancelled appointments can be notified this way' }, { status: 400 })
    }

    const client = app.clients as any
    const service = app.services as any
    const tenant = app.tenants as any
    const lang = (tenant.settings?.language as 'en' | 'es' | 'it') || 'es'
    const t = (translations as any)[lang]
    const dateLocale = (dateLocales as any)[lang]

    // Construct message
    const dateStr = format(parseISO(app.start_at), "EEEE d 'a las' HH:mm", { locale: dateLocale })
    const title = t.bot_cancellation_title
    const body = t.bot_cancellation_desc(client.first_name, service?.name || '', dateStr, tenant.name)
    
    const fullText = `${title}\n\n${body}`
    const waText = fullText.replace(/<b>/g, '*').replace(/<\/b>/g, '*')

    // Send via WhatsApp (currently we only support WhatsApp for this manual trigger)
    await MessageService.sendMessage({
      channel: 'whatsapp',
      chat_id: client.phone,
      tenant_id,
      text: waText
    })

    // Update notification status
    await supabase
      .from('appointments')
      .update({ cancellation_notified: true, cancellation_notified_notes: 'Enviado por WhatsApp automático' })
      .eq('id', appointment_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API Notify] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

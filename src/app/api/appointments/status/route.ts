import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NotificationService } from "@/services/notification.service"
import { translations, Language } from "@/lib/i18n"
import { format } from "date-fns"

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, tenant_id } = body

  if (!id || !status || !tenant_id) {
    return NextResponse.json({ error: "id, status, and tenant_id required" }, { status: 400 })
  }

  const validStatuses = ["pending", "confirmed", "awaiting_confirmation", "cancelled", "completed", "no_show", "rescheduled"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: tuData } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single()

  if (!tuData) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: appointment, error: fetchErr } = await supabase
    .from("appointments")
    .select("*, clients(first_name, last_name), professionals(full_name)")
    .eq("id", id)
    .eq("tenant_id", tenant_id)
    .single()

  if (fetchErr || !appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  if (tuData.role === "professional") {
    const { data: profData } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profData || appointment.professional_id !== profData.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (status === "completed" || status === "no_show") {
    const { data: tenantCfg } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant_id)
      .single()

    const lang: Language = tenantCfg?.settings?.language || "es"
    const t = translations[lang] || translations["es"]

    const patientName = appointment.clients
      ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
      : "—"
    const profName = appointment.professionals?.full_name || "—"
    const startDate = new Date(appointment.start_at)
    const dateStr = format(startDate, lang === "en" ? "MM/dd/yyyy" : "dd/MM/yyyy")

    const supabaseAdmin = createAdminClient()

    await NotificationService.createNotification(supabaseAdmin, {
      tenant_id,
      type: "appointment_attended",
      title: status === "completed" ? t.notification_appointment_attended : t.notification_status_changed,
      body: status === "completed"
        ? t.notify_body_attended(patientName, profName, dateStr)
        : `${patientName} - ${status} con ${profName} el ${dateStr}`,
      metadata: {
        appointment_id: id,
        client_id: appointment.client_id,
        professional_id: appointment.professional_id,
      },
    })
  }

  return NextResponse.json(data)
}

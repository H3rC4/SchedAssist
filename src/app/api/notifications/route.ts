import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenant_id = searchParams.get("tenant_id")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = parseInt(searchParams.get("offset") || "0")
  const unreadOnly = searchParams.get("unread_only") === "true"

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: tuData } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single()

  if (!tuData) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenant_id)
    .order("created_at", { ascending: false })

  if (unreadOnly) {
    query = query.eq("read", false)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: data, total: count || 0 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, notification_id, mark_all_read } = body

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: tuData } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single()

  if (!tuData) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (mark_all_read) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("tenant_id", tenant_id)
      .eq("read", false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!notification_id) {
    return NextResponse.json({ error: "notification_id required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notification_id)
    .eq("tenant_id", tenant_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

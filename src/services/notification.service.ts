import { NotificationType } from "@/types"

interface CreateNotificationParams {
  tenant_id: string
  type: NotificationType
  title: string
  body: string
  user_id?: string | null
  metadata?: Record<string, any>
}

export class NotificationService {
  /**
   * Create a notification. Uses supabaseAdmin (service_role) to bypass RLS for INSERT.
   */
  static async createNotification(
    supabaseAdmin: any,
    params: CreateNotificationParams
  ) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert([{
        tenant_id: params.tenant_id,
        type: params.type,
        title: params.title,
        body: params.body,
        user_id: params.user_id || null,
        metadata: params.metadata || {},
        read: false,
      }])
      .select("*")
      .single()

    if (error) {
      console.error("[NotificationService] Failed to create notification:", error)
      return null
    }

    return data
  }

  /**
   * Fetch notifications for a tenant, with optional user_id and pagination.
   */
  static async fetchNotifications(
    supabase: any,
    params: {
      tenant_id: string
      limit?: number
      offset?: number
      unread_only?: boolean
    }
  ) {
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("tenant_id", params.tenant_id)
      .order("created_at", { ascending: false })

    if (params.unread_only) {
      query = query.eq("read", false)
    }

    query = query.range(
      params.offset || 0,
      (params.offset || 0) + (params.limit || 20) - 1
    )

    const { data, error, count } = await query

    if (error) throw error

    return { notifications: data || [], total: count || 0 }
  }

  /**
   * Mark single notification as read.
   */
  static async markAsRead(
    supabase: any,
    params: { notification_id: string; tenant_id: string }
  ) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", params.notification_id)
      .eq("tenant_id", params.tenant_id)

    if (error) throw error
    return true
  }

  /**
   * Mark all tenant notifications as read.
   */
  static async markAllAsRead(
    supabase: any,
    params: { tenant_id: string }
  ) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("tenant_id", params.tenant_id)
      .eq("read", false)

    if (error) throw error
    return true
  }

  /**
   * Get unread count for a tenant.
   */
  static async getUnreadCount(
    supabase: any,
    params: { tenant_id: string }
  ): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", params.tenant_id)
      .eq("read", false)

    if (error) {
      console.error("[NotificationService] Failed to get unread count:", error)
      return 0
    }

    return count || 0
  }
}

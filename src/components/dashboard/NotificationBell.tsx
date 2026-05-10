"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Notification } from "@/types"

interface NotificationBellProps {
  tenantId: string
  lang?: "en" | "es" | "it"
  onClick: () => void
}

export function NotificationBell({ tenantId, lang = "es", onClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?tenant_id=${tenantId}&unread_only=true&limit=1`)
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.total || 0)
      }
    } catch (e) {
      console.error("[NotificationBell] Failed to fetch unread count:", e)
    }
  }, [tenantId])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, fetchUnreadCount, supabase])

  return (
    <button
      onClick={onClick}
      className="relative p-1.5 rounded-lg text-on-surface-muted hover:bg-surface-container-low transition-colors"
    >
      <Bell className="h-4.5 w-4.5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-error text-white text-[8px] font-black flex items-center justify-center leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}

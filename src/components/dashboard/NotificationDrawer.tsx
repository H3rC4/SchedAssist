"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Bell, CheckCircle2, CalendarCheck, XCircle, RefreshCw,
  AlertTriangle, CheckCheck, Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Notification } from "@/types"
import { format, parseISO } from "date-fns"

interface NotificationDrawerProps {
  tenantId: string
  lang?: "en" | "es" | "it"
  isOpen: boolean
  onClose: () => void
  onMarkAllRead: () => void
  translations: any
}

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  appointment_created: CalendarCheck,
  appointment_cancelled: XCircle,
  appointment_rescheduled: RefreshCw,
  professional_blocked: AlertTriangle,
  appointment_confirmed: CheckCircle2,
  appointment_attended: CheckCheck,
  plan_activated: Sparkles,
}

const TYPE_COLORS: Record<string, string> = {
  appointment_created: "text-emerald-600 bg-emerald-50",
  appointment_cancelled: "text-red-600 bg-red-50",
  appointment_rescheduled: "text-amber-600 bg-amber-50",
  professional_blocked: "text-red-600 bg-red-50",
  appointment_confirmed: "text-primary bg-primary/5",
  appointment_attended: "text-emerald-600 bg-emerald-50",
  plan_activated: "text-primary bg-primary/5",
}

function relativeTime(dateStr: string, lang: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (lang === "es") {
    if (diffSec < 60) return "ahora"
    if (diffMin < 60) return `hace ${diffMin} min`
    if (diffHr < 24) return `hace ${diffHr}h`
    if (diffDay === 1) return "ayer"
    return `hace ${diffDay}d`
  }
  if (lang === "it") {
    if (diffSec < 60) return "ora"
    if (diffMin < 60) return `${diffMin} min fa`
    if (diffHr < 24) return `${diffHr} ore fa`
    if (diffDay === 1) return "ieri"
    return `${diffDay}gg fa`
  }
  if (diffSec < 60) return "now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return "yesterday"
  return `${diffDay}d ago`
}

function extractDateFromBody(body: string): string | null {
  // Try to extract a date like dd/MM/yyyy or MM/dd/yyyy
  const dateMatch = body.match(/(\d{2}\/\d{2}\/\d{4})/)
  return dateMatch ? dateMatch[0] : null
}

export function NotificationDrawer({
  tenantId,
  lang = "es",
  isOpen,
  onClose,
  onMarkAllRead,
  translations: T,
}: NotificationDrawerProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?tenant_id=${tenantId}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error("[NotificationDrawer] Failed to fetch:", e)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    if (!tenantId || !isOpen) return

    const channel = supabase
      .channel("notifications-drawer")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, isOpen, supabase])

  async function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_id: tenantId, notification_id: notif.id }),
        })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        )
      } catch (e) {
        console.error("[NotificationDrawer] Failed to mark read:", e)
      }
    }

    // Navigate based on type
    const meta = notif.metadata || {}
    let targetDate: string | null = null
    const body = notif.body || ""
    const dateMatch = extractDateFromBody(body)
    if (dateMatch) {
      const parts = dateMatch.split("/")
      // Normalize to yyyy-MM-dd
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          targetDate = `${parts[2]}-${parts[0]}-${parts[1]}` // MM/dd/yyyy -> yyyy-MM-dd
        } else if (parts[0].length === 4) {
          targetDate = dateMatch // yyyy-MM-dd already
        } else {
          targetDate = `${parts[2]}-${parts[1]}-${parts[0]}` // dd/MM/yyyy -> yyyy-MM-dd
        }
      }
    }

    if (targetDate) {
      router.push(`/dashboard/appointments?date=${targetDate}`)
    } else {
      router.push("/dashboard/appointments")
    }

    onClose()
  }

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, mark_all_read: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      onMarkAllRead()
    } catch (e) {
      console.error("[NotificationDrawer] Failed to mark all read:", e)
    }
  }

  const hasUnread = notifications.some((n) => !n.read)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface h-full shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-on-surface/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-on-surface tracking-tighter uppercase">
                    {T.notifications_title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors px-2 py-1"
                  >
                    {T.notifications_mark_all_read}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-on-surface/5 rounded-full transition-all"
                >
                  <X className="h-4 w-4 text-on-surface/40" />
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="h-8 w-8 border-[3px] border-primary/10 border-t-primary animate-spin rounded-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-on-surface/[0.02] flex items-center justify-center mb-6">
                    <Bell className="h-8 w-8 text-on-surface/20" />
                  </div>
                  <p className="text-sm font-black text-on-surface/40 uppercase tracking-wider mb-2">
                    {T.notifications_empty}
                  </p>
                  <p className="text-[10px] text-on-surface/30 font-bold leading-relaxed max-w-[220px]">
                    {T.notifications_empty_desc}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-on-surface/5">
                  <AnimatePresence>
                    {notifications.map((notif) => {
                      const IconComp = TYPE_ICONS[notif.type] || Bell
                      const colorClass = TYPE_COLORS[notif.type] || "text-on-surface/40 bg-on-surface/[0.02]"

                      return (
                        <motion.button
                          key={notif.id}
                          initial={notif.read ? false : { opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-6 py-4 hover:bg-on-surface/[0.02] transition-colors group ${
                            !notif.read ? "bg-primary/[0.02]" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                            >
                              <IconComp className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-on-surface uppercase tracking-wider">
                                  {notif.title}
                                </span>
                                <span className="text-[8px] font-bold text-on-surface/30 uppercase tracking-wider ml-2 flex-shrink-0">
                                  {relativeTime(notif.created_at, lang)}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface/60 font-bold leading-snug line-clamp-2">
                                {notif.body}
                              </p>
                              {!notif.read && (
                                <div className="mt-1.5">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

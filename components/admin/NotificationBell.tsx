'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type NotifType = 'new_order' | 'low_stock' | 'new_customer' | 'general'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

function formatTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function notifIcon(type: NotifType): string {
  if (type === 'new_order') return '📦'
  if (type === 'low_stock') return '⚠️'
  if (type === 'new_customer') return '👤'
  return '🔔'
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [requesting, setRequesting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fireBrowserNotif = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' })
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const json = await res.json()
      setNotifications(json.notifications ?? [])
    } catch {
      // silently ignore — notifications table may not be set up yet
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    loadNotifications()
  }, [loadNotifications])

  // Subscribe to Supabase Realtime for new orders
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new as Record<string, unknown>
          const orderNumber = String(order.order_number ?? 'New Order')
          const amount = order.total_amount ? `₹${order.total_amount}` : ''
          const title = `New Order: ${orderNumber}`
          const body = `Order placed${amount ? ` for ${amount}` : ''}`

          try {
            const res = await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'new_order',
                title,
                body,
                data: { order_id: order.id, order_number: orderNumber },
              }),
            })
            if (res.ok) {
              const json = await res.json()
              if (json.notification) {
                setNotifications((prev) => [json.notification, ...prev])
              }
            }
          } catch {
            // network error — still fire browser notification
          }

          fireBrowserNotif(title, body)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fireBrowserNotif])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    setRequesting(true)
    const result = await Notification.requestPermission()
    setPermission(result)
    setRequesting(false)
  }

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* ignore */ }
  }

  const markRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* ignore */ }
  }

  return (
    <>
      <style>{`
        .nb-wrap { position: relative; }

        .nb-btn {
          width: 35px; height: 35px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: white;
          border: 1px solid var(--sand-200, #e8e3d8);
          color: var(--sand-500, #998f7a);
          cursor: pointer;
          position: relative;
          transition: all .18s;
        }
        .nb-btn:hover {
          border-color: var(--sand-300, #d6cfc0);
          color: var(--ink, #14120e);
          box-shadow: 0 2px 8px rgba(0,0,0,.07);
        }
        .nb-btn-active {
          border-color: var(--accent, #c8622a) !important;
          color: var(--accent, #c8622a) !important;
        }
        .nb-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent, #c8622a);
          border: 1.5px solid white;
          animation: nb-pulse 2s ease-in-out infinite;
        }
        @keyframes nb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,98,42,.5); }
          50%       { box-shadow: 0 0 0 4px rgba(200,98,42,0); }
        }
        .nb-count {
          position: absolute;
          top: -4px; right: -4px;
          min-width: 16px; height: 16px;
          border-radius: 99px;
          background: var(--accent, #c8622a);
          color: white;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px;
          border: 1.5px solid white;
        }

        .nb-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 340px;
          background: white;
          border: 1px solid var(--sand-200, #e8e3d8);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
          z-index: 200;
          overflow: hidden;
          animation: nb-in .15s ease;
        }
        @keyframes nb-in {
          from { opacity: 0; transform: translateY(-6px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nb-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid var(--sand-100, #f3f0ea);
        }
        .nb-header-left { display: flex; align-items: center; gap: 7px; }
        .nb-header-title {
          font-size: 13px; font-weight: 700;
          color: var(--ink, #14120e); letter-spacing: -.01em;
        }
        .nb-header-badge {
          font-size: 10px; font-weight: 700;
          background: rgba(200,98,42,.12);
          color: var(--accent, #c8622a);
          padding: 2px 7px; border-radius: 99px;
        }
        .nb-mark-all {
          font-size: 11px; font-weight: 600;
          color: var(--accent, #c8622a);
          background: none; border: none; cursor: pointer;
          padding: 0; font-family: inherit;
          transition: opacity .15s;
        }
        .nb-mark-all:hover { opacity: .7; }

        .nb-permission {
          margin: 10px 12px;
          padding: 10px 12px;
          background: rgba(200,98,42,.07);
          border: 1px solid rgba(200,98,42,.2);
          border-radius: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .nb-permission-text {
          font-size: 11.5px; color: var(--sand-700, #5a5349); line-height: 1.4; flex: 1;
        }
        .nb-enable-btn {
          flex-shrink: 0;
          padding: 5px 12px;
          background: var(--accent, #c8622a);
          color: white;
          border: none; border-radius: 6px;
          font-size: 11.5px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          transition: background .15s;
        }
        .nb-enable-btn:hover { background: var(--accent-2, #e07a3d); }
        .nb-enable-btn:disabled { opacity: .6; cursor: not-allowed; }

        .nb-blocked {
          margin: 10px 12px;
          padding: 8px 12px;
          background: rgba(220,38,38,.06);
          border: 1px solid rgba(220,38,38,.15);
          border-radius: 8px;
          font-size: 11px; color: #dc2626; line-height: 1.4;
        }

        .nb-list { max-height: 340px; overflow-y: auto; }

        .nb-empty {
          padding: 32px 16px;
          text-align: center;
          font-size: 13px; color: var(--sand-400, #b8ae9a);
        }
        .nb-empty-icon { font-size: 28px; margin-bottom: 8px; }

        .nb-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 11px 14px;
          border-bottom: 1px solid var(--sand-100, #f3f0ea);
          cursor: pointer;
          transition: background .15s;
        }
        .nb-item:last-child { border-bottom: none; }
        .nb-item:hover { background: var(--sand-50, #faf8f5); }
        .nb-item-unread { background: rgba(200,98,42,.04); }
        .nb-item-unread:hover { background: rgba(200,98,42,.07); }

        .nb-icon {
          font-size: 16px;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: var(--sand-100, #f3f0ea);
          flex-shrink: 0;
        }
        .nb-text { flex: 1; min-width: 0; }
        .nb-title {
          font-size: 12.5px; font-weight: 600;
          color: var(--ink, #14120e); line-height: 1.35; margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-body {
          font-size: 11.5px; color: var(--sand-500, #998f7a); line-height: 1.4;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-time { font-size: 10.5px; color: var(--sand-400, #b8ae9a); margin-top: 3px; }

        .nb-unread-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent, #c8622a); flex-shrink: 0; margin-top: 6px;
        }

        .nb-footer {
          padding: 8px 12px;
          border-top: 1px solid var(--sand-100, #f3f0ea);
          text-align: center;
        }
        .nb-footer-link {
          font-size: 11.5px; font-weight: 600;
          color: var(--sand-500, #998f7a);
          text-decoration: none; transition: color .15s;
        }
        .nb-footer-link:hover { color: var(--accent, #c8622a); }
      `}</style>

      <div className="nb-wrap" ref={dropdownRef}>
        <button
          className={`nb-btn${open ? ' nb-btn-active' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {unreadCount > 0 && (
            unreadCount <= 9
              ? <span className="nb-dot" />
              : <span className="nb-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="nb-dropdown">
            <div className="nb-header">
              <div className="nb-header-left">
                <span className="nb-header-title">Notifications</span>
                {unreadCount > 0 && (
                  <span className="nb-header-badge">{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button className="nb-mark-all" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            {permission === 'default' && (
              <div className="nb-permission">
                <span className="nb-permission-text">
                  Enable browser notifications to get alerted for new orders instantly.
                </span>
                <button
                  className="nb-enable-btn"
                  onClick={requestPermission}
                  disabled={requesting}
                >
                  {requesting ? 'Asking…' : 'Enable'}
                </button>
              </div>
            )}

            {permission === 'denied' && (
              <div className="nb-blocked">
                🔕 Notifications are blocked. Go to your browser settings → Site Settings → Notifications to allow them.
              </div>
            )}

            <div className="nb-list">
              {notifications.length === 0 ? (
                <div className="nb-empty">
                  <div className="nb-empty-icon">🔔</div>
                  <div>No notifications yet</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: 'var(--sand-300)' }}>
                    New orders will appear here in real-time
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`nb-item${n.is_read ? '' : ' nb-item-unread'}`}
                    onClick={() => { if (!n.is_read) markRead(n.id) }}
                  >
                    <span className="nb-icon">{notifIcon(n.type)}</span>
                    <div className="nb-text">
                      <div className="nb-title">{n.title}</div>
                      <div className="nb-body">{n.body}</div>
                      <div className="nb-time">{formatTime(n.created_at)}</div>
                    </div>
                    {!n.is_read && <span className="nb-unread-dot" />}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="nb-footer">
                <a href="/admin/orders" className="nb-footer-link" onClick={() => setOpen(false)}>
                  View all orders →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

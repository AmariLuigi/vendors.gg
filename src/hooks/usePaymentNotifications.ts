'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { PaymentNotification } from '@/lib/types/payment'

interface UsePaymentNotificationsReturn {
  notifications: PaymentNotification[]
  loading: boolean
  error: string | null
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function usePaymentNotifications(): UsePaymentNotificationsReturn {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<PaymentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/payments/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data.data || data.notifications || [])
    } catch (err) {
      console.error('Error fetching payment notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/payments/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      })

      if (!response.ok) {
        console.error(`Failed to mark notification as read: ${response.status}`)
        return // Don't update local state on error
      }

      // Update local state only if API call succeeds
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, readAt: new Date() }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Don't update local state on error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.readAt)
        .map(notification => notification.id)
      
      if (unreadIds.length === 0) return

      const response = await fetch('/api/payments/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadIds
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`)
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, readAt: new Date() }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [notifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/payments/notifications?ids=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Failed to delete notification: ${response.status}`)
        return // Don't update local state on error
      }

      // Update local state only if API call succeeds
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
      // Don't update local state on error
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.readAt).length

  // Fetch notifications on mount and when session changes
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!session?.user?.id) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifications])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}
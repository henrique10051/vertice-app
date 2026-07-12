import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotificationIfNotExists,
  type Notification,
} from '@/services/notifications'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  createNotification: (title: string, message: string, type: Notification['type']) => Promise<void>
  refetch: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const [notifRes, countRes] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ])
    setNotifications(notifRes.data || [])
    setUnreadCount(countRes.count || 0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await markAllNotificationsAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [user])

  const createNotification = useCallback(
    async (title: string, message: string, type: Notification['type']) => {
      if (!user) return
      await createNotificationIfNotExists(user.id, title, message, type)
      await refetch()
    },
    [user, refetch],
  )

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        createNotification,
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

import { renderHook, act, waitFor } from '@testing-library/react'
import { usePaymentNotifications } from '@/hooks/usePaymentNotifications'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

const mockNotifications = [
  {
    id: 'notif_1',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'You received $50.00 from John Doe',
    amount: 5000,
    orderId: 'order_1',
    readAt: undefined,
    createdAt: new Date('2023-12-01T10:00:00Z'),
  },
  {
    id: 'notif_2',
    type: 'payment_sent',
    title: 'Payment Sent',
    message: 'You sent $25.00 to Jane Smith',
    amount: 2500,
    orderId: 'order_2',
    readAt: new Date('2023-12-01T09:30:00Z'),
    createdAt: new Date('2023-12-01T09:00:00Z'),
  },
  {
    id: 'notif_3',
    type: 'order_status_changed',
    title: 'Order Shipped',
    message: 'Your order has been shipped',
    orderId: 'order_3',
    readAt: undefined,
    createdAt: new Date('2023-12-01T08:00:00Z'),
  },
]

describe('usePaymentNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('fetches notifications on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockNotifications,
      }),
    } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    expect(result.current.loading).toBe(true)
    expect(result.current.notifications).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notifications).toEqual(mockNotifications)
    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/payments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notifications).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('calculates unread count correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockNotifications,
      }),
    } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Two notifications are unread (notif_1 and notif_3)
    expect(result.current.unreadCount).toBe(2)
  })

  it('marks notification as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      result.current.markAsRead('notif_1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/payments/notif_1/read', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // The notification should be marked as read locally
    const updatedNotification = result.current.notifications.find((n: any) => n.id === 'notif_1')
    expect(updatedNotification?.readAt).toBeDefined()
    expect(result.current.unreadCount).toBe(1)
  })

  it('deletes notification', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      result.current.deleteNotification('notif_1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/payments/notif_1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // The notification should be removed from the list
    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.notifications.find((n: any) => n.id === 'notif_1')).toBeUndefined()
  })

  it('marks all notifications as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/payments/read-all', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // All notifications should be marked as read
    expect(result.current.unreadCount).toBe(0)
    result.current.notifications.forEach((notification: any) => {
      expect(notification.readAt).toBeDefined()
    })
  })

  it('refreshes notifications', async () => {
    const updatedNotifications = [
      ...mockNotifications,
      {
        id: 'notif_4',
        type: 'payment_received',
        title: 'New Payment',
        message: 'You received $100.00',
        amount: 10000,
        orderId: 'order_4',
        isRead: false,
        createdAt: new Date(),
      },
    ]

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: updatedNotifications,
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notifications).toHaveLength(3)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.notifications).toHaveLength(4)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('handles API errors for mark as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Not found',
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.markAsRead('notif_1')
    })

    // The notification should not be marked as read if API call fails
    const notification = result.current.notifications.find((n: any) => n.id === 'notif_1')
    expect(notification?.readAt).toBeUndefined()
  })

  it('handles API errors for delete notification', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNotifications,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Not found',
        }),
      } as Response)

    const { result } = renderHook(() => usePaymentNotifications())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteNotification('notif_1')
    })

    // The notification should not be deleted if API call fails
    expect(result.current.notifications).toHaveLength(3)
    expect(result.current.notifications.find((n: any) => n.id === 'notif_1')).toBeDefined()
  })
})
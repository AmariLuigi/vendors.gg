// Payment Hooks
// Custom React hooks for payment operations and state management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Order,
  PaymentMethod,
  PaymentTransaction,
  EscrowHold,
  Refund,
  PaymentNotification,
  CreateOrderRequest,
  ProcessPaymentRequest,
  ApiResponse,
  PaginatedResponse,
  OrderStatus,
  PaymentStatus
} from '@/lib/types/payment';

// Payment methods hook
export function usePaymentMethods() {
  const { data: session } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/methods?active=true');
      const data: ApiResponse<PaymentMethod[]> = await response.json();

      if (data.success) {
        setPaymentMethods(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch payment methods');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('❌ Fetch payment methods error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const addPaymentMethod = useCallback(async (methodData: Partial<PaymentMethod>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });

      const data: ApiResponse<PaymentMethod> = await response.json();

      if (data.success) {
        setPaymentMethods(prev => [...prev, data.data!]);
        toast.success('Payment method added successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to add payment method');
        toast.error(data.error || 'Failed to add payment method');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Add payment method error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePaymentMethod = useCallback(async (id: string, updates: Partial<PaymentMethod>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<PaymentMethod> = await response.json();

      if (data.success) {
        setPaymentMethods(prev => 
          prev.map(method => method.id === id ? { ...method, ...data.data } : method)
        );
        toast.success('Payment method updated successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to update payment method');
        toast.error(data.error || 'Failed to update payment method');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Update payment method error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setPaymentMethods(prev => prev.filter(method => method.id !== id));
        toast.success('Payment method removed successfully');
        return true;
      } else {
        setError(data.error || 'Failed to remove payment method');
        toast.error(data.error || 'Failed to remove payment method');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Delete payment method error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault: true }),
      });

      const data: ApiResponse<PaymentMethod> = await response.json();

      if (data.success) {
        setPaymentMethods(prev => 
          prev.map(method => ({ 
            ...method, 
            isDefault: method.id === id 
          }))
        );
        toast.success('Default payment method updated successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to set default payment method');
        toast.error(data.error || 'Failed to set default payment method');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Set default payment method error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    refresh: fetchPaymentMethods,
  };
}

// Orders hook
export function useOrders(options?: { role?: 'buyer' | 'seller' }) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = useCallback(async (page = 1, filters?: {
    status?: OrderStatus;
    type?: 'buyer' | 'seller';
  }) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);

      const response = await fetch(`/api/payments/orders?${params}`);
      const data: PaginatedResponse<Order> = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('❌ Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, pagination.limit]);

  const createOrder = useCallback(async (orderData: CreateOrderRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data: ApiResponse<Order> = await response.json();

      if (data.success) {
        setOrders(prev => [data.data!, ...prev]);
        toast.success('Order created successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to create order');
        toast.error(data.error || 'Failed to create order');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Create order error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<Order> = await response.json();

      if (data.success) {
        setOrders(prev => 
          prev.map(order => order.id === id ? { ...order, ...data.data } : order)
        );
        toast.success('Order updated successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to update order');
        toast.error(data.error || 'Failed to update order');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Update order error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string, reason: string) => {
    return updateOrder(id, { status: 'cancelled', buyerNotes: reason });
  }, [updateOrder]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    return updateOrder(id, { status: status as OrderStatus });
  }, [updateOrder]);

  useEffect(() => {
    fetchOrders(1, { type: options?.role });
  }, [fetchOrders, options?.role]);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createOrder,
    updateOrder,
    cancelOrder,
    updateOrderStatus,
    refresh: fetchOrders,
  };
}

// Payment processing hook
export function usePaymentProcessing() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (paymentData: ProcessPaymentRequest) => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data: ApiResponse<PaymentTransaction> = await response.json();

      if (data.success) {
        toast.success('Payment processed successfully');
        return data.data;
      } else {
        setError(data.error || 'Payment processing failed');
        toast.error(data.error || 'Payment processing failed');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Process payment error:', err);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    error,
    processPayment,
  };
}

// Escrow hook
export function useEscrow() {
  const { data: session } = useSession();
  const [escrowHolds, setEscrowHolds] = useState<EscrowHold[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrowHolds = useCallback(async (filters?: {
    status?: string;
    orderId?: string;
  }) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.orderId) params.append('orderId', filters.orderId);

      const response = await fetch(`/api/payments/escrow?${params}`);
      const data: PaginatedResponse<EscrowHold> = await response.json();

      if (data.success) {
        setEscrowHolds(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch escrow holds');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('❌ Fetch escrow holds error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const releaseEscrow = useCallback(async (escrowId: string, releaseData: {
    releaseAmount?: number;
    releaseReason: string;
    releaseNotes?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ escrowId, ...releaseData }),
      });

      const data: ApiResponse<EscrowHold> = await response.json();

      if (data.success) {
        setEscrowHolds(prev => 
          prev.map(escrow => escrow.id === escrowId ? { ...escrow, ...data.data } : escrow)
        );
        toast.success('Escrow released successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to release escrow');
        toast.error(data.error || 'Failed to release escrow');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Release escrow error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const disputeEscrow = useCallback(async (escrowId: string, disputeData: {
    disputeReason: string;
    disputeNotes?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/escrow', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ escrowId, ...disputeData }),
      });

      const data: ApiResponse<EscrowHold> = await response.json();

      if (data.success) {
        setEscrowHolds(prev => 
          prev.map(escrow => escrow.id === escrowId ? { ...escrow, ...data.data } : escrow)
        );
        toast.success('Escrow dispute created successfully');
        return data.data;
      } else {
        setError(data.error || 'Failed to dispute escrow');
        toast.error(data.error || 'Failed to dispute escrow');
        return null;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Dispute escrow error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscrowHolds();
  }, [fetchEscrowHolds]);

  return {
    escrowHolds,
    loading,
    error,
    fetchEscrowHolds,
    releaseEscrow,
    disputeEscrow,
  };
}

// Payment notifications hook
export function usePaymentNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (filters?: {
    type?: string;
    isRead?: boolean;
  }) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());

      const response = await fetch(`/api/payments/notifications?${params}`);
      const data: PaginatedResponse<PaymentNotification> & { unreadCount: number } = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('❌ Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        return true;
      } else {
        setError(data.error || 'Failed to mark notifications as read');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('❌ Mark notifications as read error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('ids', notificationIds.join(','));

      const response = await fetch(`/api/payments/notifications?${params}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setNotifications(prev => 
          prev.filter(notification => !notificationIds.includes(notification.id))
        );
        // Update unread count
        const deletedUnreadCount = notifications.filter(n => 
          notificationIds.includes(n.id) && !n.readAt
        ).length;
        setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
        toast.success('Notifications deleted successfully');
        return true;
      } else {
        setError(data.error || 'Failed to delete notifications');
        toast.error(data.error || 'Failed to delete notifications');
        return false;
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
      console.error('❌ Delete notifications error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotifications,
  };
}
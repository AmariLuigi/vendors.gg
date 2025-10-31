// Payment Context
// Global payment state management using React Context

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  Order,
  PaymentMethod,
  PaymentNotification,
  EscrowHold,
  OrderStatus,
  PaymentStatus
} from '@/lib/types/payment';

// Payment state interface
interface PaymentState {
  // Payment methods
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod | null;
  
  // Orders
  orders: Order[];
  activeOrders: Order[];
  
  // Notifications
  notifications: PaymentNotification[];
  unreadNotifications: number;
  
  // Escrow
  escrowHolds: EscrowHold[];
  
  // UI state
  loading: {
    paymentMethods: boolean;
    orders: boolean;
    notifications: boolean;
    escrow: boolean;
    processing: boolean;
  };
  
  errors: {
    paymentMethods: string | null;
    orders: string | null;
    notifications: string | null;
    escrow: string | null;
    processing: string | null;
  };
}

// Payment actions
type PaymentAction =
  // Payment methods actions
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: { id: string; updates: Partial<PaymentMethod> } }
  | { type: 'REMOVE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_DEFAULT_PAYMENT_METHOD'; payload: PaymentMethod }
  
  // Orders actions
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: { id: string; updates: Partial<Order> } }
  | { type: 'REMOVE_ORDER'; payload: string }
  
  // Notifications actions
  | { type: 'SET_NOTIFICATIONS'; payload: PaymentNotification[] }
  | { type: 'ADD_NOTIFICATION'; payload: PaymentNotification }
  | { type: 'MARK_NOTIFICATIONS_READ'; payload: string[] }
  | { type: 'REMOVE_NOTIFICATIONS'; payload: string[] }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  
  // Escrow actions
  | { type: 'SET_ESCROW_HOLDS'; payload: EscrowHold[] }
  | { type: 'UPDATE_ESCROW_HOLD'; payload: { id: string; updates: Partial<EscrowHold> } }
  
  // Loading actions
  | { type: 'SET_LOADING'; payload: { key: keyof PaymentState['loading']; value: boolean } }
  
  // Error actions
  | { type: 'SET_ERROR'; payload: { key: keyof PaymentState['errors']; value: string | null } }
  
  // Reset actions
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PaymentState = {
  paymentMethods: [],
  defaultPaymentMethod: null,
  orders: [],
  activeOrders: [],
  notifications: [],
  unreadNotifications: 0,
  escrowHolds: [],
  loading: {
    paymentMethods: false,
    orders: false,
    notifications: false,
    escrow: false,
    processing: false,
  },
  errors: {
    paymentMethods: null,
    orders: null,
    notifications: null,
    escrow: null,
    processing: null,
  },
};

// Payment reducer
function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    // Payment methods
    case 'SET_PAYMENT_METHODS':
      return {
        ...state,
        paymentMethods: action.payload,
        defaultPaymentMethod: action.payload.find(method => method.isDefault) || null,
      };
    
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: [...state.paymentMethods, action.payload],
        defaultPaymentMethod: action.payload.isDefault ? action.payload : state.defaultPaymentMethod,
      };
    
    case 'UPDATE_PAYMENT_METHOD':
      const updatedMethods = state.paymentMethods.map(method =>
        method.id === action.payload.id ? { ...method, ...action.payload.updates } : method
      );
      return {
        ...state,
        paymentMethods: updatedMethods,
        defaultPaymentMethod: updatedMethods.find(method => method.isDefault) || null,
      };
    
    case 'REMOVE_PAYMENT_METHOD':
      const filteredMethods = state.paymentMethods.filter(method => method.id !== action.payload);
      return {
        ...state,
        paymentMethods: filteredMethods,
        defaultPaymentMethod: state.defaultPaymentMethod?.id === action.payload 
          ? filteredMethods.find(method => method.isDefault) || null 
          : state.defaultPaymentMethod,
      };
    
    case 'SET_DEFAULT_PAYMENT_METHOD':
      return {
        ...state,
        defaultPaymentMethod: action.payload,
      };
    
    // Orders
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        activeOrders: action.payload.filter(order => 
          ['pending', 'paid', 'processing', 'shipped'].includes(order.status)
        ),
      };
    
    case 'ADD_ORDER':
      const newOrders = [action.payload, ...state.orders];
      return {
        ...state,
        orders: newOrders,
        activeOrders: newOrders.filter(order => 
          ['pending', 'paid', 'processing', 'shipped'].includes(order.status)
        ),
      };
    
    case 'UPDATE_ORDER':
      const updatedOrders = state.orders.map(order =>
        order.id === action.payload.id ? { ...order, ...action.payload.updates } : order
      );
      return {
        ...state,
        orders: updatedOrders,
        activeOrders: updatedOrders.filter(order => 
          ['pending', 'paid', 'processing', 'shipped'].includes(order.status)
        ),
      };
    
    case 'REMOVE_ORDER':
      const filteredOrders = state.orders.filter(order => order.id !== action.payload);
      return {
        ...state,
        orders: filteredOrders,
        activeOrders: filteredOrders.filter(order => 
          ['pending', 'paid', 'processing', 'shipped'].includes(order.status)
        ),
      };
    
    // Notifications
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadNotifications: action.payload.filter(n => !n.readAt).length,
      };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadNotifications: newNotifications.filter(n => !n.readAt).length,
      };
    
    case 'MARK_NOTIFICATIONS_READ':
      const markedNotifications = state.notifications.map(notification =>
        action.payload.includes(notification.id) 
          ? { ...notification, readAt: new Date() }
          : notification
      );
      return {
        ...state,
        notifications: markedNotifications,
        unreadNotifications: markedNotifications.filter(n => !n.readAt).length,
      };
    
    case 'REMOVE_NOTIFICATIONS':
      const remainingNotifications = state.notifications.filter(
        notification => !action.payload.includes(notification.id)
      );
      return {
        ...state,
        notifications: remainingNotifications,
        unreadNotifications: remainingNotifications.filter(n => !n.readAt).length,
      };
    
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadNotifications: action.payload,
      };
    
    // Escrow
    case 'SET_ESCROW_HOLDS':
      return {
        ...state,
        escrowHolds: action.payload,
      };
    
    case 'UPDATE_ESCROW_HOLD':
      return {
        ...state,
        escrowHolds: state.escrowHolds.map(escrow =>
          escrow.id === action.payload.id ? { ...escrow, ...action.payload.updates } : escrow
        ),
      };
    
    // Loading
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    
    // Errors
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };
    
    // Reset
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Payment context
interface PaymentContextType {
  state: PaymentState;
  dispatch: React.Dispatch<PaymentAction>;
  
  // Helper functions
  getOrderById: (id: string) => Order | undefined;
  getPaymentMethodById: (id: string) => PaymentMethod | undefined;
  getEscrowHoldByOrderId: (orderId: string) => EscrowHold | undefined;
  hasActiveOrders: () => boolean;
  hasUnreadNotifications: () => boolean;
  getTotalEscrowAmount: () => number;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Payment provider component
interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const { data: session } = useSession();

  // Helper functions
  const getOrderById = (id: string) => state.orders.find(order => order.id === id);
  
  const getPaymentMethodById = (id: string) => 
    state.paymentMethods.find(method => method.id === id);
  
  const getEscrowHoldByOrderId = (orderId: string) => 
    state.escrowHolds.find(escrow => escrow.orderId === orderId);
  
  const hasActiveOrders = () => state.activeOrders.length > 0;
  
  const hasUnreadNotifications = () => state.unreadNotifications > 0;
  
  const getTotalEscrowAmount = () => 
    state.escrowHolds
      .filter(escrow => escrow.status === 'held')
      .reduce((total, escrow) => total + escrow.amount, 0);

  // Initialize data when user session is available
  useEffect(() => {
    if (session?.user?.id) {
      // Initialize payment data
      initializePaymentData();
    } else {
      // Reset state when user logs out
      dispatch({ type: 'RESET_STATE' });
    }
  }, [session?.user?.id]);

  const initializePaymentData = async () => {
    try {
      // Fetch payment methods
      dispatch({ type: 'SET_LOADING', payload: { key: 'paymentMethods', value: true } });
      const methodsResponse = await fetch('/api/payments/methods');
      const methodsData = await methodsResponse.json();
      
      if (methodsData.success) {
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: methodsData.data || [] });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { key: 'paymentMethods', value: methodsData.error } });
      }
      dispatch({ type: 'SET_LOADING', payload: { key: 'paymentMethods', value: false } });

      // Fetch orders
      dispatch({ type: 'SET_LOADING', payload: { key: 'orders', value: true } });
      const ordersResponse = await fetch('/api/payments/orders');
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success) {
        dispatch({ type: 'SET_ORDERS', payload: ordersData.data || [] });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { key: 'orders', value: ordersData.error } });
      }
      dispatch({ type: 'SET_LOADING', payload: { key: 'orders', value: false } });

      // Fetch notifications
      dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: true } });
      const notificationsResponse = await fetch('/api/payments/notifications');
      const notificationsData = await notificationsResponse.json();
      
      if (notificationsData.success) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsData.data || [] });
        dispatch({ type: 'SET_UNREAD_COUNT', payload: notificationsData.unreadCount || 0 });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { key: 'notifications', value: notificationsData.error } });
      }
      dispatch({ type: 'SET_LOADING', payload: { key: 'notifications', value: false } });

      // Fetch escrow holds
      dispatch({ type: 'SET_LOADING', payload: { key: 'escrow', value: true } });
      const escrowResponse = await fetch('/api/payments/escrow');
      const escrowData = await escrowResponse.json();
      
      if (escrowData.success) {
        dispatch({ type: 'SET_ESCROW_HOLDS', payload: escrowData.data || [] });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { key: 'escrow', value: escrowData.error } });
      }
      dispatch({ type: 'SET_LOADING', payload: { key: 'escrow', value: false } });

    } catch (error) {
      console.error('❌ Initialize payment data error:', error);
      dispatch({ type: 'SET_ERROR', payload: { key: 'paymentMethods', value: 'Failed to initialize payment data' } });
    }
  };

  const contextValue: PaymentContextType = {
    state,
    dispatch,
    getOrderById,
    getPaymentMethodById,
    getEscrowHoldByOrderId,
    hasActiveOrders,
    hasUnreadNotifications,
    getTotalEscrowAmount,
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
}

// Custom hook to use payment context
export function usePaymentContext() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
}

// Selector hooks for specific data
export function usePaymentMethods() {
  const { state } = usePaymentContext();
  return {
    paymentMethods: state.paymentMethods,
    defaultPaymentMethod: state.defaultPaymentMethod,
    loading: state.loading.paymentMethods,
    error: state.errors.paymentMethods,
  };
}

export function useOrders() {
  const { state } = usePaymentContext();
  return {
    orders: state.orders,
    activeOrders: state.activeOrders,
    loading: state.loading.orders,
    error: state.errors.orders,
  };
}

export function usePaymentNotifications() {
  const { state } = usePaymentContext();
  return {
    notifications: state.notifications,
    unreadCount: state.unreadNotifications,
    loading: state.loading.notifications,
    error: state.errors.notifications,
  };
}

export function useEscrowHolds() {
  const { state } = usePaymentContext();
  return {
    escrowHolds: state.escrowHolds,
    totalEscrowAmount: state.escrowHolds
      .filter(escrow => escrow.status === 'held')
      .reduce((total, escrow) => total + escrow.amount, 0),
    loading: state.loading.escrow,
    error: state.errors.escrow,
  };
}
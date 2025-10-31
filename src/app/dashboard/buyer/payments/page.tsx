'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentMethodCard } from '@/components/payments/PaymentMethodCard'
import { AddPaymentMethodDialog } from '@/components/payments/AddPaymentMethodDialog'
import { OrderCard } from '@/components/payments/OrderCard'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useOrders } from '@/hooks/useOrders'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Plus, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { PaymentMethod, Order } from '@/lib/types/payment'

export default function BuyerPaymentsPage() {
  const { data: session } = useSession()
  const [selectedTab, setSelectedTab] = useState('payment-methods')
  
  const {
    paymentMethods,
    loading: paymentMethodsLoading,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    refresh: refreshPaymentMethods
  } = usePaymentMethods()

  const {
    orders,
    loading: ordersLoading,
    updateOrderStatus,
    refresh: refreshOrders
  } = useOrders({ role: 'buyer' })

  const handleEditPaymentMethod = async (method: PaymentMethod) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon')
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethod(id)
      toast.success('Payment method deleted successfully')
    } catch (error) {
      toast.error('Failed to delete payment method')
    }
  }

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id)
      toast.success('Default payment method updated')
    } catch (error) {
      toast.error('Failed to update default payment method')
    }
  }

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      toast.success('Order status updated successfully')
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const handleViewOrderDetails = (order: Order) => {
    // TODO: Navigate to order details page
    toast.info('Order details page coming soon')
  }

  const handleContactSeller = (order: Order) => {
    // TODO: Navigate to chat with seller
    toast.info('Chat functionality coming soon')
  }

  // Calculate statistics
  const totalSpent = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
  const completedOrders = orders.filter((order: any) => order.status === 'completed').length
  const pendingOrders = orders.filter((order: any) => order.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">
            Manage your payment methods and view order history
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalSpent / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across {orders.length} orders
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentMethods.length}</div>
              <p className="text-xs text-muted-foreground">
                {paymentMethods.filter((pm: any) => pm.isDefault).length} default
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your saved payment methods for faster checkout
                  </CardDescription>
                </div>
                <AddPaymentMethodDialog onSuccess={() => refreshPaymentMethods()}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </AddPaymentMethodDialog>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No payment methods</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a payment method to start making purchases
                  </p>
                  <AddPaymentMethodDialog onSuccess={() => refreshPaymentMethods()}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Payment Method
                    </Button>
                  </AddPaymentMethodDialog>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paymentMethods.map((paymentMethod: any) => (
                    <PaymentMethodCard
                      key={paymentMethod.id}
                      paymentMethod={paymentMethod}
                      onEdit={handleEditPaymentMethod}
                      onDelete={handleDeletePaymentMethod}
                      onSetDefault={handleSetDefaultPaymentMethod}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                View and manage your purchase history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Your purchase history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      currentUserId={session?.user?.id || ''}
                      onViewDetails={handleViewOrderDetails}
                      onStartChat={handleContactSeller}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
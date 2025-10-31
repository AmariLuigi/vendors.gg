"use client"

import * as React from "react"
import { 
  CreditCard, 
  Package, 
  Shield, 
  Bell, 
  Plus, 
  Filter,
  Search,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PaymentMethodCard } from "./PaymentMethodCard"
import { AddPaymentMethodDialog } from "./AddPaymentMethodDialog"
import { OrderCard } from "./OrderCard"
import { EscrowCard } from "./EscrowCard"
import { PaymentNotificationCard } from "./PaymentNotificationCard"
import { PaymentProcessingDialog } from "./PaymentProcessingDialog"
import { 
  usePaymentMethods, 
  useOrders, 
  useEscrow, 
  usePaymentNotifications 
} from "@/lib/hooks/usePayments"
import { useSession } from "next-auth/react"
import type { Order, OrderStatus, EscrowStatus } from "@/lib/types/payment"

interface PaymentDashboardProps {
  className?: string
}

export function PaymentDashboard({ className }: PaymentDashboardProps) {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<OrderStatus | "all">("all")
  const [escrowStatusFilter, setEscrowStatusFilter] = React.useState<EscrowStatus | "all">("all")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = React.useState(false)

  const { 
    paymentMethods, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    loading: methodsLoading 
  } = usePaymentMethods()

  const { 
    orders, 
    createOrder, 
    updateOrder, 
    cancelOrder,
    loading: ordersLoading 
  } = useOrders()

  const { 
    escrowHolds, 
    releaseEscrow, 
    disputeEscrow,
    loading: escrowLoading 
  } = useEscrow()

  const { 
    notifications, 
    markAsRead, 
    deleteNotifications,
    loading: notificationsLoading 
  } = usePaymentNotifications()

  // Filter functions
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.id.includes(searchTerm)
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, orderStatusFilter])

  const filteredEscrow = React.useMemo(() => {
    return escrowHolds.filter(escrow => {
      const matchesSearch = escrow.id.includes(searchTerm) || escrow.orderId.includes(searchTerm)
      const matchesStatus = escrowStatusFilter === "all" || escrow.status === escrowStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [escrowHolds, searchTerm, escrowStatusFilter])

  const unreadNotifications = notifications.filter(n => !n.readAt)

  // Statistics
  const stats = React.useMemo(() => {
    const totalOrders = orders.length
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length
    const totalEscrow = escrowHolds.reduce((sum, e) => sum + (e.amount - (e.releasedAmount || 0)), 0)
    const completedOrders = orders.filter(o => o.status === 'delivered').length

    return {
      totalOrders,
      activeOrders,
      totalEscrow,
      completedOrders
    }
  }, [orders, escrowHolds])

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      await updatePaymentMethod(methodId, { isDefault: true })
    } catch (error) {
      console.error('Failed to set default payment method:', error)
    }
  }

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentMethod(methodId)
      } catch (error) {
        console.error('Failed to delete payment method:', error)
      }
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId, 'Cancelled by user')
      } catch (error) {
        console.error('Failed to cancel order:', error)
      }
    }
  }

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrder(orderId, { status: 'delivered' })
    } catch (error) {
      console.error('Failed to mark order as delivered:', error)
    }
  }

  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      await releaseEscrow(escrowId, {
        releaseReason: 'Funds released by buyer'
      })
    } catch (error) {
      console.error('Failed to release escrow:', error)
    }
  }

  const handleDisputeEscrow = async (escrowId: string, reason: string) => {
    try {
      await disputeEscrow(escrowId, {
        disputeReason: reason
      })
    } catch (error) {
      console.error('Failed to dispute escrow:', error)
    }
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your payment methods, orders, and transactions
          </p>
        </div>
        <AddPaymentMethodDialog>
          <Button>
            <Plus className="size-4 mr-2" />
            Add Payment Method
          </Button>
        </AddPaymentMethodDialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrders} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEscrow)}</div>
            <p className="text-xs text-muted-foreground">
              Funds held securely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="size-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="escrow" className="flex items-center gap-2">
            <Shield className="size-4" />
            Escrow
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-1">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={orderStatusFilter} onValueChange={(value) => setOrderStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {ordersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentUserId={session?.user?.id}
                  onCancelOrder={handleCancelOrder}
                  onMarkDelivered={handleMarkDelivered}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="space-y-4">
          <div className="space-y-4">
            {methodsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading payment methods...
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="size-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No payment methods</h3>
                <p className="text-muted-foreground mb-4">
                  Add a payment method to start making purchases
                </p>
                <AddPaymentMethodDialog>
                  <Button>Add Payment Method</Button>
                </AddPaymentMethodDialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onSetDefault={handleSetDefaultPaymentMethod}
                    onDelete={handleDeletePaymentMethod}
                    isLoading={methodsLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search escrow holds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={escrowStatusFilter} onValueChange={(value) => setEscrowStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="held">Held</SelectItem>
                <SelectItem value="partial_release">Partial Release</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {escrowLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading escrow holds...
              </div>
            ) : filteredEscrow.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No escrow holds found
              </div>
            ) : (
              filteredEscrow.map((escrow) => (
                <EscrowCard
                  key={escrow.id}
                  escrow={escrow}
                  currentUserId={session?.user?.id}
                  onRelease={handleReleaseEscrow}
                  onDispute={handleDisputeEscrow}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            {notificationsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <PaymentNotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={(id) => markAsRead([id])}
                  onDelete={(id) => deleteNotifications([id])}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Processing Dialog */}
      <PaymentProcessingDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        order={selectedOrder}
        onSuccess={() => {
          setShowPaymentDialog(false)
          setSelectedOrder(null)
        }}
      />
    </div>
  )
}
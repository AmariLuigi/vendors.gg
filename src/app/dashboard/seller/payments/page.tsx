'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderCard } from '@/components/payments/OrderCard'
import { useOrders } from '@/hooks/useOrders'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Order } from '@/lib/types/payment'
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

export default function SellerPaymentsPage() {
  const { data: session } = useSession()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30d')
  
  const {
    orders,
    loading: ordersLoading,
    updateOrderStatus,
    refresh: refreshOrders
  } = useOrders({ role: 'seller' })

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

  const handleContactBuyer = (order: Order) => {
    // TODO: Navigate to chat with buyer
    toast.info('Chat functionality coming soon')
  }

  const handleExportData = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon')
  }

  // Calculate statistics
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.totalAmount - order.platformFee - order.processingFee), 0)
  
  const pendingRevenue = orders
    .filter(order => ['pending', 'paid', 'delivered'].includes(order.status))
    .reduce((sum, order) => sum + (order.totalAmount - order.platformFee - order.processingFee), 0)
  
  const totalOrders = orders.length
  const completedOrders = orders.filter(order => order.status === 'completed').length
  const pendingOrders = orders.filter(order => ['pending', 'paid'].includes(order.status)).length
  const shippedOrders = orders.filter(order => order.status === 'delivered').length

  // Filter orders by date range
  const getFilteredOrders = () => {
    const now = new Date()
    let startDate: Date
    
    switch (dateRange) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case 'month':
        startDate = startOfMonth(now)
        break
      default:
        return orders
    }
    
    return orders.filter(order => new Date(order.createdAt) >= startDate)
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales, revenue, and manage orders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {completedOrders} completed orders
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
              <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(pendingRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {pendingOrders + shippedOrders} pending orders
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
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {completedOrders} completed, {pendingOrders} pending
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
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Order completion rate
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders requiring your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.slice(0, 3).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="font-medium">Order #{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Buyer ID: {order.buyerId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(order.totalAmount / 100).toFixed(2)}</p>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'delivered' ? 'outline' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>Revenue chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    Complete order history and management
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
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
                    Your sales will appear here once customers start purchasing
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      currentUserId={session?.user?.id || ''}
                      onViewDetails={handleViewOrderDetails}
                      onStartChat={handleContactBuyer}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>
                Orders that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orders.filter(order => ['pending', 'paid'].includes(order.status)).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending orders</h3>
                  <p className="text-muted-foreground">
                    All orders are up to date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(order => ['pending', 'paid'].includes(order.status))
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        currentUserId={session?.user?.id || ''}
                        onViewDetails={handleViewOrderDetails}
                        onStartChat={handleContactBuyer}
                      />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>
                Successfully completed transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orders.filter(order => order.status === 'completed').length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed orders</h3>
                  <p className="text-muted-foreground">
                    Completed orders will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders
                    .filter(order => order.status === 'completed')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        currentUserId={session?.user?.id || ''}
                        onViewDetails={handleViewOrderDetails}
                        onStartChat={handleContactBuyer}
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
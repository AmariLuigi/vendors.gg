"use client"

import * as React from "react"
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, Eye, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/types/payment"

interface OrderCardProps {
  order: Order
  onViewDetails?: (order: Order) => void
  onStartChat?: (order: Order) => void
  onCancelOrder?: (orderId: string) => void
  onMarkDelivered?: (orderId: string) => void
  className?: string
  showActions?: boolean
  currentUserId?: string
}

export function OrderCard({
  order,
  onViewDetails,
  onStartChat,
  onCancelOrder,
  onMarkDelivered,
  className,
  showActions = true,
  currentUserId
}: OrderCardProps) {
  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock className="size-4 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="size-4 text-blue-500" />
      case 'processing':
        return <Package className="size-4 text-blue-500" />
      case 'shipped':
        return <Package className="size-4 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="size-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="size-4 text-red-500" />
      case 'refunded':
        return <AlertTriangle className="size-4 text-orange-500" />
      default:
        return <Clock className="size-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'confirmed':
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'refunded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100) // Assuming amounts are in cents
  }

  const isBuyer = currentUserId === order.buyerId
  const isSeller = currentUserId === order.sellerId
  const canCancel = order.status === 'pending' && isBuyer
  const canMarkDelivered = order.status === 'shipped' && isSeller

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Order #{order.id.slice(-8)}</span>
              <Badge className={cn("text-xs", getStatusColor())}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onViewDetails(order)}
                  title="View details"
                >
                  <Eye className="size-4" />
                </Button>
              )}
              {onStartChat && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onStartChat(order)}
                  title="Start chat"
                >
                  <MessageSquare className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{order.listingTitle}</div>
              <div className="text-sm text-muted-foreground">
                Quantity: {order.quantity}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatCurrency(order.totalAmount, order.currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                + {formatCurrency(order.platformFee + order.processingFee, order.currency)} fees
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Buyer:</span>
              <div className="font-medium">{order.buyerEmail}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Seller:</span>
              <div className="font-medium">{order.sellerEmail}</div>
            </div>
          </div>

          {order.deliveryMethod && (
            <div className="text-sm">
              <span className="text-muted-foreground">Delivery:</span>
              <span className="ml-2 capitalize">{order.deliveryMethod.replace('_', ' ')}</span>
            </div>
          )}

          {order.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <div className="mt-1 p-2 bg-muted rounded text-sm">{order.notes}</div>
            </div>
          )}

          {order.deliveryProof && (
            <div className="text-sm">
              <span className="text-muted-foreground">Delivery Proof:</span>
              <div className="mt-1 p-2 bg-muted rounded text-sm">{order.deliveryProof}</div>
            </div>
          )}
        </div>

        {showActions && (canCancel || canMarkDelivered) && (
          <>
            <Separator />
            <div className="flex gap-2">
              {canCancel && onCancelOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelOrder(order.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel Order
                </Button>
              )}
              {canMarkDelivered && onMarkDelivered && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onMarkDelivered(order.id)}
                >
                  Mark as Delivered
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
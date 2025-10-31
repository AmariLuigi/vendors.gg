"use client"

import * as React from "react"
import { 
  Bell, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Clock,
  X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PaymentNotification } from "@/lib/types/payment"

interface PaymentNotificationCardProps {
  notification: PaymentNotification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  onClick?: (notification: PaymentNotification) => void
  className?: string
  showActions?: boolean
}

export function PaymentNotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  className,
  showActions = true
}: PaymentNotificationCardProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'payment_received':
      case 'order_completed':
        return <CheckCircle className="size-5 text-green-500" />
      case 'payment_failed':
        return <XCircle className="size-5 text-red-500" />
      case 'payment_pending':
        return <Clock className="size-5 text-yellow-500" />
      case 'order_completed':
      case 'order_cancelled':
        return <Package className="size-5 text-blue-500" />
      case 'escrow_released':
      case 'refund_processed':
        return <DollarSign className="size-5 text-green-500" />
      case 'dispute_opened':
      case 'refund_failed':
        return <AlertTriangle className="size-5 text-red-500" />
      default:
        return <Bell className="size-5 text-gray-500" />
    }
  }

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'payment_received':
      case 'order_completed':
      case 'escrow_released':
      case 'refund_processed':
        return 'text-green-600 dark:text-green-400'
      case 'payment_failed':
      case 'dispute_opened':
      case 'refund_failed':
        return 'text-red-600 dark:text-red-400'
      case 'payment_pending':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'order_cancelled':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date()
    const notificationDate = typeof date === 'string' ? new Date(date) : date
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return notificationDate.toLocaleDateString()
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification)
    }
    if (!notification.readAt && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notification.id)
    }
  }

  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-colors hover:bg-muted/50",
        !notification.readAt && "border-l-4 border-l-primary bg-muted/30",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon()}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn(
                  "font-medium text-sm",
                  !notification.readAt && "font-semibold"
                )}>
                  {notification.title}
                </h4>
                {!notification.readAt && (
                  <div className="size-2 bg-primary rounded-full" />
                )}
              </div>
              
              {showActions && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.readAt && onMarkAsRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleMarkAsRead}
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CheckCircle className="size-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDelete}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={getNotificationColor()}>
                {notification.type.replace('_', ' ').toUpperCase()}
              </span>
              <span>{formatRelativeTime(notification.createdAt)}</span>
            </div>
            
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="text-xs text-muted-foreground">
                {notification.metadata.orderId && (
                  <span>Order #{notification.metadata.orderId.slice(-8)}</span>
                )}
                {notification.metadata.amount && notification.metadata.currency && (
                  <span className="ml-2">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: notification.metadata.currency.toUpperCase(),
                    }).format(notification.metadata.amount / 100)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import * as React from "react"
import { Bell, MessageCircle, CreditCard, Package, Shield, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConversations } from "@/hooks/useConversations"
import { usePaymentNotifications } from "@/hooks/usePaymentNotifications"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { PaymentNotification } from "@/lib/types/payment"

interface UnifiedNotificationsProps {
  className?: string
}

export function UnifiedNotifications({ className }: UnifiedNotificationsProps) {
  const { conversations, unreadMessagesCount } = useConversations()
  const { 
    notifications: paymentNotifications, 
    markAsRead, 
    deleteNotification,
    loading: paymentLoading 
  } = usePaymentNotifications()

  const unreadPaymentNotifications = paymentNotifications.filter(n => !n.readAt)
  const totalUnreadCount = unreadMessagesCount + unreadPaymentNotifications.length

  const formatTimeAgo = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return formatDistanceToNow(dateObj, { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  const getPaymentNotificationIcon = (type: PaymentNotification['type']) => {
    switch (type) {
      case 'payment_received':
        return <CreditCard className="size-4 text-green-600" />
      case 'payment_failed':
      case 'payment_pending':
        return <CreditCard className="size-4 text-red-600" />
      case 'order_completed':
      case 'order_cancelled':
        return <Package className="size-4 text-blue-600" />
      case 'escrow_released':
      case 'dispute_opened':
        return <Shield className="size-4 text-purple-600" />
      case 'refund_processed':
      case 'refund_failed':
        return <CreditCard className="size-4 text-orange-600" />
      default:
        return <Bell className="size-4 text-gray-600" />
    }
  }

  const getPaymentNotificationColor = (type: PaymentNotification['type']) => {
    switch (type) {
      case 'payment_received':
      case 'escrow_released':
      case 'refund_processed':
        return 'text-green-600'
      case 'payment_failed':
      case 'refund_failed':
        return 'text-red-600'
      case 'order_completed':
      case 'order_cancelled':
        return 'text-blue-600'
      case 'dispute_opened':
        return 'text-purple-600'
      case 'payment_pending':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleMarkPaymentAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDeletePaymentNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="size-5" />
            {totalUnreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-96 p-0 bg-card text-card-foreground shadow-lg border rounded-xl"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {totalUnreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalUnreadCount} unread
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
              <TabsTrigger value="all" className="text-xs">
                All ({totalUnreadCount})
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs">
                Messages ({unreadMessagesCount})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs">
                Payments ({unreadPaymentNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="max-h-80 overflow-y-auto">
                {/* Payment Notifications */}
                {unreadPaymentNotifications.slice(0, 3).map((notification) => (
                  <div key={`payment-${notification.id}`} className="p-3 border-b hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getPaymentNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.metadata?.amount && (
                              <p className={`text-xs font-medium mt-1 ${getPaymentNotificationColor(notification.type)}`}>
                                {formatCurrency(notification.metadata.amount, notification.metadata.currency)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMarkPaymentAsRead(notification.id)}
                            >
                              <Check className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeletePaymentNotification(notification.id)}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Chat Notifications */}
                {conversations.slice(0, 3).map((conversation) => {
                  const otherUser = conversation.buyer?.id !== conversation.sellerId 
                    ? conversation.buyer 
                    : conversation.seller
                  const displayName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Unknown User'
                  const isUnread = (conversation.unreadCount || 0) > 0

                  if (!isUnread) return null

                  return (
                    <Link 
                      key={`chat-${conversation.id}`} 
                      href={`/chat?conversation=${conversation.id}`}
                      className="block"
                    >
                      <div className="p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <Avatar className="size-8 flex-shrink-0">
                            <AvatarImage src={otherUser?.avatar} />
                            <AvatarFallback className="text-xs">
                              {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {displayName}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatTimeAgo(conversation.lastMessageAt || conversation.createdAt)}
                              </span>
                            </div>
                            
                            {conversation.listing?.title && (
                              <p className="text-xs text-muted-foreground mb-1 truncate">
                                Re: {conversation.listing.title}
                              </p>
                            )}
                            
                            {conversation.lastMessage && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <MessageCircle className="size-3 text-blue-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {totalUnreadCount === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <div className="max-h-80 overflow-y-auto">
                {conversations.filter(c => (c.unreadCount || 0) > 0).length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No unread messages</p>
                  </div>
                ) : (
                  conversations
                    .filter(c => (c.unreadCount || 0) > 0)
                    .slice(0, 5)
                    .map((conversation) => {
                      const otherUser = conversation.buyer?.id !== conversation.sellerId 
                        ? conversation.buyer 
                        : conversation.seller
                      const displayName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Unknown User'

                      return (
                        <Link 
                          key={conversation.id} 
                          href={`/chat?conversation=${conversation.id}`}
                          className="block"
                        >
                          <div className="p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <Avatar className="size-8 flex-shrink-0">
                                <AvatarImage src={otherUser?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium truncate">
                                    {displayName}
                                  </p>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    {formatTimeAgo(conversation.lastMessageAt || conversation.createdAt)}
                                  </span>
                                </div>
                                
                                {conversation.listing?.title && (
                                  <p className="text-xs text-muted-foreground mb-1 truncate">
                                    Re: {conversation.listing.title}
                                  </p>
                                )}
                                
                                {conversation.lastMessage && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                                
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <div className="max-h-80 overflow-y-auto">
                {paymentLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Loading notifications...</p>
                  </div>
                ) : unreadPaymentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <CreditCard className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payment notifications</p>
                  </div>
                ) : (
                  unreadPaymentNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 border-b hover:bg-muted/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPaymentNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.metadata?.amount && (
                                <p className={`text-xs font-medium mt-1 ${getPaymentNotificationColor(notification.type)}`}>
                                  {formatCurrency(notification.metadata.amount, notification.metadata.currency)}
                                </p>
                              )}
                              {notification.metadata?.orderId && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Order: {notification.metadata.orderId}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMarkPaymentAsRead(notification.id)}
                              >
                                <Check className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeletePaymentNotification(notification.id)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />
          
          <div className="p-3 flex justify-between">
            <Link href="/chat">
              <Button variant="outline" size="sm">
                View Messages
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="outline" size="sm">
                Payment Dashboard
              </Button>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
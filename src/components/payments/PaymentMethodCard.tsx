"use client"

import * as React from "react"
import { CreditCard, Trash2, Edit3, Star, StarOff } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/lib/types/payment"

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  onEdit?: (method: PaymentMethod) => void
  onDelete?: (methodId: string) => void
  onSetDefault?: (methodId: string) => void
  isLoading?: boolean
  className?: string
}

export function PaymentMethodCard({
  paymentMethod,
  onEdit,
  onDelete,
  onSetDefault,
  isLoading = false,
  className
}: PaymentMethodCardProps) {
  const getCardIcon = () => {
    switch (paymentMethod.type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="size-5" />
      default:
        return <CreditCard className="size-5" />
    }
  }

  const getCardBrand = () => {
    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      return paymentMethod.maskedDetails?.brand?.toUpperCase() || 'CARD'
    }
    return paymentMethod.type.replace('_', ' ').toUpperCase()
  }

  const getLastFour = () => {
    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      return paymentMethod.maskedDetails?.last4 || '****'
    }
    return '****'
  }

  const getExpiryDate = () => {
    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      const expMonth = paymentMethod.maskedDetails?.expiryMonth
      const expYear = paymentMethod.maskedDetails?.expiryYear
      if (expMonth && expYear) {
        return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`
      }
    }
    return null
  }

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getCardIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{getCardBrand()}</span>
                {paymentMethod.provider && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {paymentMethod.provider}
                  </Badge>
                )}
                {paymentMethod.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="size-3 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                •••• •••• •••• {getLastFour()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!paymentMethod.isDefault && onSetDefault && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onSetDefault(paymentMethod.id)}
                disabled={isLoading}
                title="Set as default"
              >
                <StarOff className="size-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(paymentMethod)}
                disabled={isLoading}
                title="Edit payment method"
              >
                <Edit3 className="size-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(paymentMethod.id)}
                disabled={isLoading}
                title="Delete payment method"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          {getExpiryDate() && (
            <div>Expires {getExpiryDate()}</div>
          )}
          {paymentMethod.billingAddress && (
            <div className="truncate">
              {paymentMethod.billingAddress.city}, {paymentMethod.billingAddress.country}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Added {new Date(paymentMethod.createdAt).toLocaleDateString()}</span>
            <Badge 
              variant={paymentMethod.isActive ? "secondary" : "outline"}
              className="text-xs"
            >
              {paymentMethod.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
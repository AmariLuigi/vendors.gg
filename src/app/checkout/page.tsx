'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { usePaymentMethods, useOrders, usePaymentProcessing } from '@/lib/hooks/usePayments'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ShoppingCart, CreditCard, ShieldCheck } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { state, totalAmount, removeItem, clear } = useCart()
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods()
  const { createOrder } = useOrders({ role: 'buyer' })
  const { processing, processPayment } = usePaymentProcessing()

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | undefined>(undefined)
  const items = state.items || []
  const isEmpty = items.length === 0

  const totalCurrency = useMemo(() => {
    // Prefer the first item's currency; mixed currencies are shown per-line
    return items[0]?.currency || 'USD'
  }, [items])

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  const handlePlaceOrder = async () => {
    if (isEmpty) return

    try {
      if (items.length === 1) {
        const item = items[0]
        // Create order for the single cart item
        const order = await createOrder({ listingId: item.listingId, quantity: item.quantity })
        if (!order) {
          toast.error('Failed to create order')
          return
        }

        // If a payment method is selected, process payment immediately
        if (selectedPaymentMethodId) {
          const txn = await processPayment({ orderId: order.id, paymentMethodId: selectedPaymentMethodId })
          if (!txn) {
            toast.error('Payment processing failed')
            return
          }
          toast.success('Payment completed')
        } else {
          toast.success('Order created. Select payment method to complete.')
        }

        // Remove item from cart and navigate to payments dashboard
        await removeItem(item.listingId)
        router.push('/dashboard/buyer/payments')
      } else {
        // Multi-item checkout: create individual orders for each cart item
        let successCount = 0
        for (const item of items) {
          const order = await createOrder({ listingId: item.listingId, quantity: item.quantity })
          if (order) successCount += 1
        }

        if (successCount > 0) {
          toast.success(`Created ${successCount} order(s). Complete payment per order.`)
          await clear()
          router.push('/dashboard/buyer/payments')
        } else {
          toast.error('Failed to create orders')
        }
      }
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error('Something went wrong during checkout')
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">Review your items and complete your purchase</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          {items.length} item{items.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Items summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Items in your cart</CardDescription>
          </CardHeader>
          <CardContent>
            {isEmpty ? (
              <div className="text-center py-10 text-muted-foreground">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.listingId} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price * item.quantity, item.currency)}</p>
                          <p className="text-xs text-muted-foreground">@ {formatCurrency(item.price, item.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-semibold">{formatCurrency(totalAmount, totalCurrency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Select a method and place your order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Secure checkout with escrow
            </div>

            {items.length === 1 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment method</label>
                {methodsLoading ? (
                  <div className="text-muted-foreground">Loading methods...</div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No saved methods. You can add one under Buyer Payments.
                  </div>
                ) : (
                  <Select onValueChange={(v) => setSelectedPaymentMethodId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{m.type.replace('_', ' ')} {m.isDefault ? '(Default)' : ''}</span>
                            {m.provider && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {m.provider}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Multiple items detected. Orders will be created individually; complete payment from Buyer Payments.
              </div>
            )}

            <Button
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={isEmpty || processing || (items.length === 1 && paymentMethods.length > 0 && !selectedPaymentMethodId)}
            >
              {items.length === 1 ? 'Place Order' + (selectedPaymentMethodId ? ' & Pay' : '') : 'Place Orders'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/buyer/payments')}
            >
              Manage Payment Methods
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
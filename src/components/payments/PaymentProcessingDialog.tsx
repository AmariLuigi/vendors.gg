"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CreditCard, Loader2, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePaymentMethods, usePaymentProcessing } from "@/lib/hooks/usePayments"
import type { PaymentMethod, Order } from "@/lib/types/payment"

const paymentSchema = z.object({
  paymentMethodId: z.string().min(1, "Please select a payment method"),
  deliveryMethod: z.enum(['in_game', 'email', 'manual']),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentProcessingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onSuccess?: (order: Order) => void
  onError?: (error: string) => void
}

export function PaymentProcessingDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
  onError
}: PaymentProcessingDialogProps) {
  const { paymentMethods } = usePaymentMethods()
  const { processPayment, processing, error: processingError } = usePaymentProcessing()
  const [step, setStep] = React.useState<'form' | 'processing' | 'success' | 'error'>('form')

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethodId: '',
      deliveryMethod: 'in_game',
      notes: '',
    },
  })

  React.useEffect(() => {
    if (open && order) {
      setStep('form')
      form.reset()
      // Auto-select default payment method if available
      const defaultMethod = paymentMethods.find(m => m.isDefault && m.isActive)
      if (defaultMethod) {
        form.setValue('paymentMethodId', defaultMethod.id)
      }
    }
  }, [open, order, paymentMethods, form])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const onSubmit = async (data: PaymentFormData) => {
    if (!order) return

    setStep('processing')

    try {
      const result = await processPayment({
        orderId: order.id,
        paymentMethodId: data.paymentMethodId,
      })

      setStep('success')
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.(order)
      }, 2000)
    } catch (error) {
      setStep('error')
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    }
  }

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'credit_card' || method.type === 'debit_card') {
      const brand = method.maskedDetails?.brand || 'Card'
      const lastFour = method.maskedDetails?.last4 || '****'
      return `${brand} •••• ${lastFour}`
    }
    return method.type.replace('_', ' ').toUpperCase()
  }

  const renderFormStep = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {order && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{order.listingTitle}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {order.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.totalAmount - order.platformFee - order.processingFee, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>{formatCurrency(order.platformFee, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>{formatCurrency(order.processingFee, order.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(order.totalAmount, order.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods
                    .filter(method => method.isActive)
                    .map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>{getPaymentMethodDisplay(method)}</span>
                          {method.provider && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {method.provider}
                            </Badge>
                          )}
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Method</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="in_game">In-Game Delivery</SelectItem>
                  <SelectItem value="email">Email Delivery</SelectItem>
                  <SelectItem value="manual">Manual Coordination</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special instructions for delivery..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <Shield className="size-4" />
          <AlertDescription>
            Your payment is secured by our escrow system. Funds will be held safely until delivery is confirmed.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={processing}>
            {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
            Complete Payment
          </Button>
        </div>
      </form>
    </Form>
  )

  const renderProcessingStep = () => (
    <div className="text-center space-y-4 py-8">
      <Loader2 className="size-12 animate-spin mx-auto text-primary" />
      <div>
        <h3 className="font-medium">Processing Payment</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we process your payment securely...
        </p>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-4 py-8">
      <CheckCircle className="size-12 mx-auto text-green-500" />
      <div>
        <h3 className="font-medium text-green-700 dark:text-green-400">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground">
          Your order has been placed and the seller has been notified.
        </p>
      </div>
    </div>
  )

  const renderErrorStep = () => (
    <div className="text-center space-y-4 py-8">
      <AlertTriangle className="size-12 mx-auto text-red-500" />
      <div>
        <h3 className="font-medium text-red-700 dark:text-red-400">Payment Failed</h3>
        <p className="text-sm text-muted-foreground">
          {processingError || 'An error occurred while processing your payment.'}
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setStep('form')}>
          Try Again
        </Button>
        <Button onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </div>
  )

  const getTitle = () => {
    switch (step) {
      case 'processing':
        return 'Processing Payment'
      case 'success':
        return 'Payment Successful'
      case 'error':
        return 'Payment Failed'
      default:
        return 'Complete Payment'
    }
  }

  const getDescription = () => {
    switch (step) {
      case 'processing':
        return 'Your payment is being processed securely.'
      case 'success':
        return 'Your payment has been completed successfully.'
      case 'error':
        return 'There was an issue processing your payment.'
      default:
        return 'Review your order and complete the payment.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && renderFormStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}
      </DialogContent>
    </Dialog>
  )
}
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CreditCard, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePaymentMethods } from "@/lib/hooks/usePayments"
import { validateCardNumber, validateExpiryDate, validateCvv, validateCardholderName, formatCardNumber, getCardIcon } from "@/lib/utils/cardValidation"
import { PaymentIconWrapper } from "./PaymentIconWrapper"
import type { PaymentMethodType } from "@/lib/types/payment"

const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto'] as const),
  cardNumber: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  walletAddress: z.string().optional(),
  billingAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  isDefault: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'credit_card' || data.type === 'debit_card') {
    // Validate card number
    if (!data.cardNumber || data.cardNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card number is required",
        path: ["cardNumber"]
      });
    } else {
      const cardValidation = validateCardNumber(data.cardNumber);
      if (!cardValidation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid card number",
          path: ["cardNumber"]
        });
      }
    }
    
    // Validate expiry date
    if (!data.expiryMonth || data.expiryMonth.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry month is required",
        path: ["expiryMonth"]
      });
    }
    if (!data.expiryYear || data.expiryYear.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry year is required",
        path: ["expiryYear"]
      });
    }
    if (data.expiryMonth && data.expiryYear) {
      const expiryValidation = validateExpiryDate(data.expiryMonth, data.expiryYear);
      if (!expiryValidation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid or expired date",
          path: ["expiryMonth"]
        });
      }
    }
    
    // Validate CVV
    if (!data.cvv || data.cvv.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CVV is required",
        path: ["cvv"]
      });
    } else {
      const cardValidation = validateCardNumber(data.cardNumber || '');
      const cvvValidation = validateCvv(data.cvv, data.cardNumber);
      if (!cvvValidation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid CVV (${cardValidation.cvvName})`,
          path: ["cvv"]
        });
      }
    }
    
    // Validate cardholder name
    if (!data.cardholderName || data.cardholderName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cardholder name is required",
        path: ["cardholderName"]
      });
    } else {
      const nameValidation = validateCardholderName(data.cardholderName);
      if (!nameValidation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid cardholder name",
          path: ["cardholderName"]
        });
      }
    }
  }
  if (data.type === 'paypal') {
    if (!data.email || data.email.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for PayPal",
        path: ["email"]
      });
    }
  }
  if (data.type === 'bank_transfer') {
    if (!data.accountNumber || data.accountNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account number is required",
        path: ["accountNumber"]
      });
    }
    if (!data.routingNumber || data.routingNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Routing number is required",
        path: ["routingNumber"]
      });
    }
  }
  if (data.type === 'crypto') {
    if (!data.walletAddress || data.walletAddress.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wallet address is required",
        path: ["walletAddress"]
      });
    }
  }
})

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

interface AddPaymentMethodDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function AddPaymentMethodDialog({ children, onSuccess }: AddPaymentMethodDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { addPaymentMethod, loading } = usePaymentMethods()

  const form = useForm({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'credit_card' as const,
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
      email: '',
      accountNumber: '',
      routingNumber: '',
      walletAddress: '',
      isDefault: false,
      billingAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
  })

  const selectedType = form.watch('type')

  const onSubmit = async (data: PaymentMethodFormData) => {
    console.log('Form submitted with data:', data);
    
    try {
      const paymentMethodData: any = {
        type: data.type,
        isDefault: data.isDefault,
        billingAddress: data.billingAddress,
      }

      // Add type-specific masked details (API expects maskedDetails, not raw details)
      if (data.type === 'credit_card' || data.type === 'debit_card') {
        // Extract last 4 digits and determine card brand
        const cardNumber = data.cardNumber!.replace(/\s/g, '');
        const last4 = cardNumber.slice(-4);
        
        // Simple brand detection (in production, use a proper library)
        let brand = 'unknown';
        if (cardNumber.startsWith('4')) brand = 'visa';
        else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) brand = 'mastercard';
        else if (cardNumber.startsWith('3')) brand = 'amex';
        
        paymentMethodData.maskedDetails = {
          last4,
          brand,
          expiryMonth: parseInt(data.expiryMonth!),
          expiryYear: parseInt(data.expiryYear!),
          holderName: data.cardholderName!,
        }
      } else if (data.type === 'paypal') {
        paymentMethodData.maskedDetails = { 
          email: data.email!.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email
        }
      } else if (data.type === 'bank_transfer') {
        paymentMethodData.maskedDetails = {
          accountNumber: `***${data.accountNumber!.slice(-4)}`, // Mask account number
          routingNumber: data.routingNumber!,
        }
      } else if (data.type === 'crypto') {
        paymentMethodData.maskedDetails = { 
          walletAddress: `${data.walletAddress!.slice(0, 6)}...${data.walletAddress!.slice(-4)}` // Mask wallet
        }
      }

      console.log('Sending payment method data:', paymentMethodData);
      
      const result = await addPaymentMethod(paymentMethodData);
      console.log('Payment method added successfully:', result);
      
      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add payment method:', error);
      // Show error to user
      alert(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'credit_card':
      case 'debit_card':
        return (
          <>
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => {
                const cardIconInfo = getCardIcon(field.value || '');
                return (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="1234 5678 9012 3456" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={23} // Max length for formatted card number with spaces
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {cardIconInfo.type ? (
                            <PaymentIconWrapper type={cardIconInfo.type} format="flat" className="h-6 w-8" />
                          ) : (
                            <CreditCard className="h-6 w-8 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expiryMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                            {(i + 1).toString().padStart(2, '0')}
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
                name="expiryYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => {
                  const cardNumber = form.watch('cardNumber') || '';
                  const cardValidation = validateCardNumber(cardNumber);
                  const maxLength = cardValidation.cvvLength;
                  const placeholder = cardValidation.cvvName === 'CID' ? '1234' : '123';
                  
                  return (
                    <FormItem>
                      <FormLabel>{cardValidation.cvvName || 'CVV'}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={placeholder}
                          {...field}
                          maxLength={maxLength}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </>
        )
      case 'paypal':
        return (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PayPal Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case 'bank_transfer':
        return (
          <>
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="routingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Routing Number</FormLabel>
                  <FormControl>
                    <Input placeholder="021000021" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )
      case 'crypto':
        return (
          <FormField
            control={form.control}
            name="walletAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet Address</FormLabel>
                <FormControl>
                  <Input placeholder="0x..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="size-4 mr-2" />
            Add Payment Method
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to your account for secure transactions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderTypeSpecificFields()}

            <div className="space-y-4">
              <h4 className="font-medium">Billing Address</h4>
              <FormField
                control={form.control}
                name="billingAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingAddress.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default payment method</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Add Payment Method
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
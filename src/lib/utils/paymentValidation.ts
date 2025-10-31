/**
 * Payment validation utilities
 */

export interface PaymentMethod {
  id: string
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  cardholderName: string
  brand?: string
  last4?: string
  isDefault?: boolean
}

export interface Order {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  paymentMethodId: string
  totalAmount: number
  platformFee: number
  processingFee: number
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled' | 'refunded'
  createdAt: string
  updatedAt: string
}

/**
 * Validates a credit card number using the Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Check if it's a valid length (13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false
  }
  
  // Luhn algorithm
  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Validates expiry date (MM/YY format)
 */
export function validateExpiryDate(month: number, year: number): boolean {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Check valid month
  if (month < 1 || month > 12) {
    return false
  }
  
  // Handle both 2-digit and 4-digit years
  let normalizedYear = year
  if (year < 100) {
    // Convert 2-digit year to 4-digit year
    normalizedYear = year < 50 ? 2000 + year : 1900 + year
  }
  
  // Check if year is in the future or current year with future/current month
  if (normalizedYear > currentYear || (normalizedYear === currentYear && month >= currentMonth)) {
    return true
  }
  
  return false
}

/**
 * Validates CVV code
 */
export function validateCVV(cvv: string, cardBrand?: string): boolean {
  const cleaned = cvv.replace(/\D/g, '')
  
  // American Express uses 4 digits, others use 3
  if (cardBrand === 'amex' || cardBrand === 'american_express') {
    return cleaned.length === 4
  }
  
  return cleaned.length === 3
}

/**
 * Formats card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // American Express formatting (4-6-5)
  if (/^3[47]/.test(cleaned)) {
    const match = cleaned.match(/(\d{1,4})(\d{0,6})(\d{0,5})/)
    if (!match) return cardNumber
    
    return [match[1], match[2], match[3]]
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  
  // Standard formatting (4-4-4-4)
  const match = cleaned.match(/(\d{1,4})(\d{0,4})(\d{0,4})(\d{0,4})/)
  
  if (!match) return cardNumber
  
  return [match[1], match[2], match[3], match[4]]
    .filter(Boolean)
    .join(' ')
    .trim()
}

/**
 * Determines card brand from card number
 */
export function getCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Visa
  if (/^4/.test(cleaned)) {
    return 'visa'
  }
  
  // Mastercard
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'mastercard'
  }
  
  // American Express
  if (/^3[47]/.test(cleaned)) {
    return 'amex'
  }
  
  // Discover
  if (/^6(?:011|5)/.test(cleaned)) {
    return 'discover'
  }
  
  return 'unknown'
}

/**
 * Validates a complete payment method object
 */
export function validatePaymentMethod(paymentMethod: Partial<PaymentMethod>): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  
  if (!paymentMethod.cardNumber || !validateCardNumber(paymentMethod.cardNumber)) {
    errors.cardNumber = 'Invalid card number'
  }
  
  if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear || 
      !validateExpiryDate(paymentMethod.expiryMonth, paymentMethod.expiryYear)) {
    errors.expiryMonth = 'Invalid expiry month'
    errors.expiryYear = 'Invalid expiry year'
  }
  
  if (!paymentMethod.cvv || !validateCVV(paymentMethod.cvv, paymentMethod.brand)) {
    errors.cvv = 'Invalid CVV'
  }
  
  if (!paymentMethod.cardholderName || paymentMethod.cardholderName.trim().length < 2) {
    errors.cardholderName = 'Cardholder name is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validates an order object
 */
export function validateOrder(order: any): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  
  if (!order.listingId) {
    errors.listingId = 'Listing ID is required'
  }
  
  if (!order.sellerId) {
    errors.sellerId = 'Seller ID is required'
  }
  
  if (!order.paymentMethodId) {
    errors.paymentMethodId = 'Payment method ID is required'
  }
  
  if (!order.quantity || order.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0'
  } else if (order.quantity > 100) {
    errors.quantity = 'Quantity cannot exceed maximum of 100'
  }
  
  if (!order.deliveryMethod) {
    errors.deliveryMethod = 'Delivery method is required'
  } else if (!['physical', 'digital'].includes(order.deliveryMethod)) {
    errors.deliveryMethod = 'Invalid delivery method'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Calculates order total including fees
 */
export function calculateOrderTotal(params: {
  unitPrice: number
  quantity: number
  platformFeeRate: number
  processingFeeRate: number
}): {
  subtotal: number
  platformFee: number
  processingFee: number
  total: number
} {
  const { unitPrice, quantity, platformFeeRate, processingFeeRate } = params
  const subtotal = unitPrice * quantity
  const platformFee = Math.round(subtotal * platformFeeRate)
  const processingFee = Math.round(subtotal * processingFeeRate)
  const total = subtotal + platformFee + processingFee
  
  return {
    subtotal,
    platformFee,
    processingFee,
    total
  }
}

/**
 * Validates order status transition
 */
export function validateOrderStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['completed', 'cancelled'],
    completed: ['refunded'],
    cancelled: [],
    refunded: []
  }
  
  return validTransitions[currentStatus]?.includes(newStatus) || false
}

/**
 * Validates order status transition (alias for compatibility)
 */
export function validateOrderStatus(
  currentStatus: string,
  newStatus: string
): boolean {
  // Allow same status (no change)
  if (currentStatus === newStatus) {
    return true
  }
  
  return validateOrderStatusTransition(currentStatus, newStatus)
}
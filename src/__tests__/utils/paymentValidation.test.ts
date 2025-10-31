import {
  validatePaymentMethod,
  validateOrder,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  formatCardNumber,
  getCardBrand,
  calculateOrderTotal,
  validateOrderStatusTransition,
  validateOrderStatus
} from '@/lib/utils/paymentValidation'

describe('Payment Validation Utils', () => {
  describe('validateCardNumber', () => {
    it('validates correct Visa card numbers', () => {
      expect(validateCardNumber('4111111111111111')).toBe(true)
      expect(validateCardNumber('4000000000000002')).toBe(true)
    })

    it('validates correct Mastercard numbers', () => {
      expect(validateCardNumber('5555555555554444')).toBe(true)
      expect(validateCardNumber('5200828282828210')).toBe(true)
    })

    it('validates correct American Express numbers', () => {
      expect(validateCardNumber('378282246310005')).toBe(true)
      expect(validateCardNumber('371449635398431')).toBe(true)
    })

    it('rejects invalid card numbers', () => {
      expect(validateCardNumber('1234567890123456')).toBe(false)
      expect(validateCardNumber('4111111111111112')).toBe(false)
      expect(validateCardNumber('')).toBe(false)
      expect(validateCardNumber('abc')).toBe(false)
    })

    it('handles card numbers with spaces and dashes', () => {
      expect(validateCardNumber('4111 1111 1111 1111')).toBe(true)
      expect(validateCardNumber('4111-1111-1111-1111')).toBe(true)
    })
  })

  describe('validateExpiryDate', () => {
    it('validates future expiry dates', () => {
      const futureYear = new Date().getFullYear() + 2
      expect(validateExpiryDate(12, futureYear)).toBe(true)
      expect(validateExpiryDate(1, futureYear)).toBe(true)
    })

    it('rejects past expiry dates', () => {
      expect(validateExpiryDate(12, 2020)).toBe(false)
      expect(validateExpiryDate(1, 2021)).toBe(false)
    })

    it('handles current year correctly', () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      expect(validateExpiryDate(currentMonth + 1, currentYear)).toBe(true)
      if (currentMonth > 1) {
        expect(validateExpiryDate(currentMonth - 1, currentYear)).toBe(false)
      }
    })

    it('rejects invalid month values', () => {
      const futureYear = new Date().getFullYear() + 1
      expect(validateExpiryDate(0, futureYear)).toBe(false)
      expect(validateExpiryDate(13, futureYear)).toBe(false)
      expect(validateExpiryDate(-1, futureYear)).toBe(false)
    })
  })

  describe('validateCVV', () => {
    it('validates 3-digit CVV for most cards', () => {
      expect(validateCVV('123', 'visa')).toBe(true)
      expect(validateCVV('456', 'mastercard')).toBe(true)
      expect(validateCVV('789', 'discover')).toBe(true)
    })

    it('validates 4-digit CVV for American Express', () => {
      expect(validateCVV('1234', 'amex')).toBe(true)
      expect(validateCVV('5678', 'american_express')).toBe(true)
    })

    it('rejects invalid CVV lengths', () => {
      expect(validateCVV('12', 'visa')).toBe(false)
      expect(validateCVV('1234', 'visa')).toBe(false)
      expect(validateCVV('123', 'amex')).toBe(false)
      expect(validateCVV('12345', 'amex')).toBe(false)
    })

    it('rejects non-numeric CVV', () => {
      expect(validateCVV('abc', 'visa')).toBe(false)
      expect(validateCVV('12a', 'visa')).toBe(false)
      expect(validateCVV('', 'visa')).toBe(false)
    })
  })

  describe('formatCardNumber', () => {
    it('formats Visa/Mastercard numbers correctly', () => {
      expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
      expect(formatCardNumber('5555555555554444')).toBe('5555 5555 5555 4444')
    })

    it('formats American Express numbers correctly', () => {
      expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
      expect(formatCardNumber('371449635398431')).toBe('3714 496353 98431')
    })

    it('handles partial numbers', () => {
      expect(formatCardNumber('4111')).toBe('4111')
      expect(formatCardNumber('41111111')).toBe('4111 1111')
      expect(formatCardNumber('3782')).toBe('3782')
    })

    it('removes existing formatting', () => {
      expect(formatCardNumber('4111 1111 1111 1111')).toBe('4111 1111 1111 1111')
      expect(formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111')
    })
  })

  describe('getCardBrand', () => {
    it('identifies Visa cards', () => {
      expect(getCardBrand('4111111111111111')).toBe('visa')
      expect(getCardBrand('4000000000000002')).toBe('visa')
    })

    it('identifies Mastercard', () => {
      expect(getCardBrand('5555555555554444')).toBe('mastercard')
      expect(getCardBrand('5200828282828210')).toBe('mastercard')
    })

    it('identifies American Express', () => {
      expect(getCardBrand('378282246310005')).toBe('amex')
      expect(getCardBrand('371449635398431')).toBe('amex')
    })

    it('identifies Discover', () => {
      expect(getCardBrand('6011111111111117')).toBe('discover')
      expect(getCardBrand('6011000990139424')).toBe('discover')
    })

    it('returns unknown for unrecognized patterns', () => {
      expect(getCardBrand('1234567890123456')).toBe('unknown')
      expect(getCardBrand('9999999999999999')).toBe('unknown')
    })
  })

  describe('validatePaymentMethod', () => {
    it('validates complete payment method data', () => {
      const paymentMethod = {
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
        cardholderName: 'John Doe',
      }

      const result = validatePaymentMethod(paymentMethod)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('returns errors for invalid data', () => {
      const paymentMethod = {
        cardNumber: '1234567890123456',
        expiryMonth: 13,
        expiryYear: 2020,
        cvv: '12',
        cardholderName: '',
      }

      const result = validatePaymentMethod(paymentMethod)
      expect(result.isValid).toBe(false)
      expect(result.errors.cardNumber).toBeDefined()
      expect(result.errors.expiryMonth).toBeDefined()
      expect(result.errors.expiryYear).toBeDefined()
      expect(result.errors.cvv).toBeDefined()
      expect(result.errors.cardholderName).toBeDefined()
    })
  })

  describe('validateOrder', () => {
    it('validates complete order data', () => {
      const order = {
        listingId: 'listing_123',
        sellerId: 'seller_123',
        paymentMethodId: 'pm_123',
        quantity: 2,
        deliveryMethod: 'physical' as const,
        notes: 'Handle with care',
      }

      const result = validateOrder(order)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('returns errors for missing required fields', () => {
      const order = {
        listingId: '',
        sellerId: '',
        paymentMethodId: '',
        quantity: 0,
        deliveryMethod: 'invalid' as any,
      }

      const result = validateOrder(order)
      expect(result.isValid).toBe(false)
      expect(result.errors.listingId).toBeDefined()
      expect(result.errors.sellerId).toBeDefined()
      expect(result.errors.paymentMethodId).toBeDefined()
      expect(result.errors.quantity).toBeDefined()
      expect(result.errors.deliveryMethod).toBeDefined()
    })

    it('validates quantity limits', () => {
      const order = {
        listingId: 'listing_123',
        sellerId: 'seller_123',
        paymentMethodId: 'pm_123',
        quantity: 101, // Over limit
        deliveryMethod: 'physical' as const,
      }

      const result = validateOrder(order)
      expect(result.isValid).toBe(false)
      expect(result.errors.quantity).toContain('maximum')
    })
  })

  describe('calculateOrderTotal', () => {
    it('calculates total with platform and processing fees', () => {
      const result = calculateOrderTotal({
        unitPrice: 1000, // $10.00
        quantity: 2,
        platformFeeRate: 0.05, // 5%
        processingFeeRate: 0.03, // 3%
      })

      expect(result.subtotal).toBe(2000) // $20.00
      expect(result.platformFee).toBe(100) // $1.00 (5% of $20.00)
      expect(result.processingFee).toBe(60) // $0.60 (3% of $20.00)
      expect(result.total).toBe(2160) // $21.60
    })

    it('handles minimum fees', () => {
      const result = calculateOrderTotal({
        unitPrice: 100, // $1.00
        quantity: 1,
        platformFeeRate: 0.05,
        processingFeeRate: 0.03,
      })

      expect(result.subtotal).toBe(100)
      expect(result.platformFee).toBe(5) // 5% of $1.00
      expect(result.processingFee).toBe(3) // 3% of $1.00
      expect(result.total).toBe(108)
    })
  })

  describe('validateOrderStatus', () => {
    it('validates allowed status transitions', () => {
      expect(validateOrderStatus('pending', 'confirmed')).toBe(true)
      expect(validateOrderStatus('confirmed', 'shipped')).toBe(true)
      expect(validateOrderStatus('shipped', 'completed')).toBe(true)
      expect(validateOrderStatus('pending', 'cancelled')).toBe(true)
    })

    it('rejects invalid status transitions', () => {
      expect(validateOrderStatus('completed', 'pending')).toBe(false)
      expect(validateOrderStatus('cancelled', 'shipped')).toBe(false)
      expect(validateOrderStatus('pending', 'completed')).toBe(false)
    })

    it('allows same status (no change)', () => {
      expect(validateOrderStatus('pending', 'pending')).toBe(true)
      expect(validateOrderStatus('completed', 'completed')).toBe(true)
    })
  })
})
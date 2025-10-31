import valid from 'card-validator';
import { 
  detectCardType, 
  validateCardNumber as validateCardNumberLib, 
  formatCardNumber as formatCardNumberLib,
  maskCardNumber,
  isCardNumberPotentiallyValid,
  PaymentIcon,
  type PaymentType
} from 'react-svg-credit-card-payment-icons';

export interface CardValidationResult {
  isValid: boolean;
  isPotentiallyValid: boolean;
  cardType: string | null;
  cardBrand: string | null;
  maxLength: number;
  gaps: number[];
  cvvLength: number;
  cvvName: string;
}

export interface ExpiryValidationResult {
  isValid: boolean;
  isPotentiallyValid: boolean;
  month: number | null;
  year: number | null;
}

/**
 * Maps card types from react-svg-credit-card-payment-icons to card-validator format
 */
function mapCardType(cardType: string): { type: string; niceType: string; cvvLength: number; cvvName: string; paymentType: PaymentType | null } {
  const typeMap: Record<string, { type: string; niceType: string; cvvLength: number; cvvName: string; paymentType: PaymentType | null }> = {
    'Visa': { type: 'visa', niceType: 'Visa', cvvLength: 3, cvvName: 'CVV', paymentType: 'Visa' },
    'Mastercard': { type: 'mastercard', niceType: 'Mastercard', cvvLength: 3, cvvName: 'CVV', paymentType: 'Mastercard' },
    'Amex': { type: 'american-express', niceType: 'American Express', cvvLength: 4, cvvName: 'CID', paymentType: 'Amex' },
    'Discover': { type: 'discover', niceType: 'Discover', cvvLength: 3, cvvName: 'CVV', paymentType: 'Discover' },
    'Diners': { type: 'diners-club', niceType: 'Diners Club', cvvLength: 3, cvvName: 'CVV', paymentType: 'Diners' },
    'Jcb': { type: 'jcb', niceType: 'JCB', cvvLength: 3, cvvName: 'CVV', paymentType: 'Jcb' },
    'Unionpay': { type: 'unionpay', niceType: 'UnionPay', cvvLength: 3, cvvName: 'CVV', paymentType: 'Unionpay' },
    'Maestro': { type: 'maestro', niceType: 'Maestro', cvvLength: 3, cvvName: 'CVV', paymentType: 'Maestro' }
  };
  
  return typeMap[cardType] || { type: 'unknown', niceType: 'Unknown', cvvLength: 3, cvvName: 'CVV', paymentType: null };
}

/**
 * Validates a credit card number and returns detailed information
 */
export function validateCardNumber(cardNumber: string): CardValidationResult {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Use both libraries for comprehensive validation
  const cardValidatorResult = valid.number(cleanNumber);
  const detectedType = detectCardType(cleanNumber);
  const isValidLib = validateCardNumberLib(cleanNumber);
  const isPotentiallyValidLib = isCardNumberPotentiallyValid(cleanNumber);
  
  const mappedType = mapCardType(detectedType);
  
  return {
    isValid: cardValidatorResult.isValid && isValidLib,
    isPotentiallyValid: cardValidatorResult.isPotentiallyValid && isPotentiallyValidLib,
    cardType: mappedType.type,
    cardBrand: mappedType.niceType,
    maxLength: cardValidatorResult.card?.lengths?.[cardValidatorResult.card.lengths.length - 1] || 19,
    gaps: cardValidatorResult.card?.gaps || [4, 8, 12],
    cvvLength: mappedType.cvvLength,
    cvvName: mappedType.cvvName
  };
}

/**
 * Formats a card number with appropriate spacing
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Use the library's formatting function
  const formatted = formatCardNumberLib(cleanNumber);
  
  // If the library doesn't format it, fall back to default spacing
  if (formatted === cleanNumber) {
    const validation = validateCardNumber(cleanNumber);
    const gaps = validation.gaps;
    
    let formattedNumber = '';
    let gapIndex = 0;
    
    for (let i = 0; i < cleanNumber.length; i++) {
      if (gapIndex < gaps.length && i === gaps[gapIndex]) {
        formattedNumber += ' ';
        gapIndex++;
      }
      formattedNumber += cleanNumber[i];
    }
    
    return formattedNumber;
  }
  
  return formatted;
}

/**
 * Validates expiry date (month/year)
 */
export function validateExpiryDate(month: string | number, year: string | number): ExpiryValidationResult {
  const validation = valid.expirationDate({
    month: month.toString(),
    year: year.toString()
  });
  
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid,
    month: validation.month ? parseInt(validation.month, 10) : null,
    year: validation.year ? parseInt(validation.year, 10) : null
  };
}

/**
 * Validates CVV/CVC code
 */
export function validateCvv(cvv: string, cardNumber?: string): { isValid: boolean; isPotentiallyValid: boolean } {
  let maxLength = 4; // Default for unknown cards
  
  if (cardNumber) {
    const cardValidation = validateCardNumber(cardNumber);
    maxLength = cardValidation.cvvLength;
  }
  
  const validation = valid.cvv(cvv, maxLength);
  
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid
  };
}

/**
 * Validates cardholder name
 */
export function validateCardholderName(name: string): { isValid: boolean; isPotentiallyValid: boolean } {
  const validation = valid.cardholderName(name);
  
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid
  };
}

/**
 * Gets the appropriate card icon component based on card type
 */
export function getCardIcon(cardNumber: string): { type: PaymentType | null; component: string } {
  const cardType = detectCardType(cardNumber);
  const mappedType = mapCardType(cardType);
  
  return {
    type: mappedType.paymentType,
    component: mappedType.paymentType ? 'PaymentIcon' : 'GenericIcon'
  };
}

/**
 * Masks a card number for display purposes
 */
export function maskCardNumberForDisplay(cardNumber: string): string {
  return maskCardNumber(cardNumber);
}

/**
 * Formats expiry date as MM/YY
 */
export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length >= 2) {
    return cleanValue.slice(0, 2) + (cleanValue.length > 2 ? '/' + cleanValue.slice(2, 4) : '');
  }
  
  return cleanValue;
}

/**
 * Parses MM/YY format to month and year
 */
export function parseExpiryDate(expiryString: string): { month: string; year: string } {
  const parts = expiryString.split('/');
  const month = parts[0] || '';
  const year = parts[1] || '';
  
  return { month, year };
}

/**
 * Test card numbers for development/testing
 */
export const TEST_CARD_NUMBERS = {
  visa: '4111111111111111',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  mastercardDebit: '5200828282828210',
  amex: '378282246310005',
  discover: '6011111111111117',
  dinersClub: '30569309025904',
  jcb: '3530111333300000',
  unionPay: '6200000000000005'
};

/**
 * Gets appropriate placeholder for card input based on detected type
 */
export function getCardPlaceholder(cardNumber: string): string {
  const cardType = detectCardType(cardNumber);
  
  switch (cardType) {
    case 'Amex':
      return '•••• •••••• •••••';
    case 'Diners':
      return '•••• •••••• ••••';
    default:
      return '•••• •••• •••• ••••';
  }
}
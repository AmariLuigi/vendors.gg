"use client"

import * as React from "react"
import type { PaymentType } from "react-svg-credit-card-payment-icons"

interface PaymentIconWrapperProps {
  type: PaymentType
  format?: "flat" | "logo"
  className?: string
}

/**
 * Custom payment icon component to avoid DOM property issues
 * Renders card icons without problematic clip-path attributes
 */
export function PaymentIconWrapper({ type, format = "flat", className }: PaymentIconWrapperProps) {
  // Simple card icon SVGs for common card types
  const getCardIcon = () => {
    const baseClasses = "w-full h-full"
    
    switch (type) {
      case 'Visa':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#1A1F71"/>
            <path d="M16.5 7.5h-2.8l-1.7 9h2.8l1.7-9zm7.1 5.8c0-2.4-3.1-2.5-3.1-3.6 0-.3.3-.6 1-.7.3 0 1.1-.1 2 .4l.4-1.8c-.5-.2-1.2-.4-2-.4-2.1 0-3.6 1.1-3.6 2.7 0 1.2 1.1 1.8 1.9 2.2.8.4 1.1.7 1.1 1.1 0 .6-.7.9-1.4.9-.9 0-1.4-.1-2.2-.5l-.4 1.9c.5.2 1.4.4 2.4.4 2.2 0 3.7-1.1 3.7-2.8l.2.1zm5.8-5.8h-2.2c-.7 0-1.2.2-1.5.9l-4.3 8.1h2.2s.4-1 .4-1.2h2.7c.1.3.3 1.2.3 1.2h2l-1.6-9zm-2.8 5.9c.2-.5.9-2.4.9-2.4s.2-.5.3-.8l.2.9s.5 2.4.6 2.9l-2-.6zm-9.4-4.7l-2.6 6.2-.3-1.5c-.5-1.7-2.1-3.5-3.9-4.4l2.5 8.2h2.2l3.3-8.5h-1.2z" fill="white"/>
          </svg>
        )
      case 'Mastercard':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#000"/>
            <circle cx="15" cy="12" r="7" fill="#EB001B"/>
            <circle cx="25" cy="12" r="7" fill="#F79E1B"/>
            <path d="M20 7.5c1.5 1.3 2.5 3.2 2.5 5.5s-1 4.2-2.5 5.5c-1.5-1.3-2.5-3.2-2.5-5.5s1-4.2 2.5-5.5z" fill="#FF5F00"/>
          </svg>
        )
      case 'Amex':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#006FCF"/>
            <path d="M8.5 7.5h3l.8 1.8.8-1.8h3v9h-2.2v-5.4l-1 2.2h-1.2l-1-2.2v5.4h-2.2v-9zm8.5 0h6v1.8h-3.8v1.4h3.6v1.6h-3.6v1.4h3.8v1.8h-6v-9zm8 0h2.4l2.1 3.2v-3.2h2.2v9h-2.1l-2.4-3.6v3.6h-2.2v-9z" fill="white"/>
          </svg>
        )
      case 'Discover':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#FF6000"/>
            <path d="M6 9h2.5c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5h-2.5v-5zm2.5 3.8c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3h-1.3v2.6h1.3zm3.5-3.8h1.2v5h-1.2v-5zm3 0h1.2l1.5 2.2 1.5-2.2h1.2l-2.2 3.2v1.8h-1.2v-1.8l-2.2-3.2zm7 0h3v1h-1.8v1h1.6v1h-1.6v1h1.8v1h-3v-5z" fill="white"/>
          </svg>
        )
      case 'Jcb':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#006C44"/>
            <path d="M8 9h1.5c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-1.5v-5zm1.5 3.8c.4 0 .8-.4.8-.8v-1c0-.4-.4-.8-.8-.8h-.3v2.6h.3zm3.5-3.8h2.5c1.1 0 2 .9 2 2s-.9 2-2 2h-1.3v1h-1.2v-5zm2.5 2.8c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-1.3v1.6h1.3zm3.5-2.8h3v1h-1.8v.8h1.6v1h-1.6v1.2h1.8v1h-3v-5z" fill="white"/>
          </svg>
        )
      case 'Diners':
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#0079BE"/>
            <circle cx="12" cy="12" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="28" cy="12" r="6" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M18 12h4" stroke="white" strokeWidth="1.5"/>
          </svg>
        )
      default:
        return (
          <svg className={baseClasses} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="24" rx="4" fill="#6B7280" stroke="#9CA3AF"/>
            <path d="M12 8h16v2h-16v-2zm0 3h12v2h-12v-2zm0 3h8v2h-8v-2z" fill="#9CA3AF"/>
          </svg>
        )
    }
  }

  return (
    <div className={className}>
      {getCardIcon()}
    </div>
  )
}
// Security Middleware for PCI DSS Compliance
// Enforces security headers, rate limiting, and data protection

import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, securityConfig, securityUtils } from '@/lib/config/security';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security middleware function
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
        ...Object.fromEntries(Object.entries(securityHeaders)),
      },
    });
  }
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', securityConfig.rateLimit.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', (securityConfig.rateLimit.maxRequests - rateLimitResult.count).toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  
  // Security validation for payment routes
  if (request.nextUrl.pathname.startsWith('/api/payments')) {
    const securityValidation = validatePaymentSecurity(request);
    
    if (!securityValidation.valid) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'Security validation failed',
        details: securityValidation.errors,
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(Object.entries(securityHeaders)),
        },
      });
    }
  }
  
  // Log security events
  logSecurityEvent(request, 'request_processed');
  
  return response;
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // For Next.js, get IP from headers or connection info
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIpHeader = request.headers.get('x-real-ip');
  if (realIpHeader) {
    return realIpHeader;
  }
  
  return 'unknown';
}

// Rate limiting implementation
function checkRateLimit(clientIP: string): { allowed: boolean; count: number; resetTime: number } {
  const now = Date.now();
  const windowMs = securityConfig.rateLimit.windowMs;
  const maxRequests = securityConfig.rateLimit.maxRequests;
  
  const key = `rate_limit:${clientIP}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // New window or expired window
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    
    return { allowed: true, count: 1, resetTime };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: current.count <= maxRequests,
    count: current.count,
    resetTime: current.resetTime,
  };
}

// Validate payment-specific security requirements
function validatePaymentSecurity(request: NextRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check HTTPS requirement
  if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol !== 'https:') {
    errors.push('HTTPS required for payment operations');
  }
  
  // Check Content-Type for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Invalid Content-Type for payment request');
    }
  }
  
  // Check for required security headers
  const requiredHeaders = ['user-agent', 'origin'];
  requiredHeaders.forEach(header => {
    if (!request.headers.get(header)) {
      errors.push(`Missing required header: ${header}`);
    }
  });
  
  // Validate origin for CORS
  const origin = request.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) {
    errors.push('Invalid origin for payment request');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check if origin is allowed
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);
  
  return allowedOrigins.includes(origin);
}

// Log security events
function logSecurityEvent(request: NextRequest, eventType: string, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    clientIP: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    method: request.method,
    url: request.nextUrl.pathname,
    details,
  };
  
  // In production, send to proper logging service
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Security Event:', logEntry);
  }
  
  // Store in audit log (implement based on your logging infrastructure)
  storeAuditLog(logEntry);
}

// Store audit log entry
function storeAuditLog(logEntry: any) {
  // Implementation depends on your logging infrastructure
  // Examples: Winston, Pino, CloudWatch, Datadog, etc.
  
  // For now, we'll just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Audit Log:', JSON.stringify(logEntry, null, 2));
  }
}

// Security event types for monitoring
export enum SecurityEventType {
  REQUEST_PROCESSED = 'request_processed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_ORIGIN = 'invalid_origin',
  MISSING_SECURITY_HEADER = 'missing_security_header',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  DATA_ACCESS = 'data_access',
  PAYMENT_PROCESSED = 'payment_processed',
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
}

// Enhanced security monitoring
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private suspiciousActivityThreshold = 10;
  private activityStore = new Map<string, number>();
  
  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }
  
  // Track suspicious activity
  trackActivity(clientIP: string, eventType: SecurityEventType): boolean {
    const key = `activity:${clientIP}`;
    const current = this.activityStore.get(key) || 0;
    const newCount = current + 1;
    
    this.activityStore.set(key, newCount);
    
    // Check if threshold exceeded
    if (newCount >= this.suspiciousActivityThreshold) {
      this.handleSuspiciousActivity(clientIP, eventType, newCount);
      return true; // Suspicious activity detected
    }
    
    return false;
  }
  
  // Handle suspicious activity
  private handleSuspiciousActivity(clientIP: string, eventType: SecurityEventType, count: number) {
    const alertData = {
      clientIP,
      eventType,
      count,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    };
    
    // Log the alert
    console.warn('🚨 SECURITY ALERT:', alertData);
    
    // In production, you would:
    // 1. Send alert to security team
    // 2. Temporarily block the IP
    // 3. Trigger additional monitoring
    // 4. Log to SIEM system
    
    this.sendSecurityAlert(alertData);
  }
  
  // Send security alert
  private sendSecurityAlert(alertData: any) {
    // Implementation for sending alerts
    // Examples: Email, Slack, PagerDuty, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Security Alert Sent:', alertData);
    }
  }
  
  // Reset activity counter (call periodically)
  resetActivityCounters() {
    this.activityStore.clear();
  }
}

// Compliance checker
export class ComplianceChecker {
  // Check PCI DSS compliance
  static checkPCICompliance(): { compliant: boolean; issues: string[] } {
    const result = securityUtils.validateCompliance();
    return {
      compliant: result.passed,
      issues: result.issues
    };
  }
  
  // Validate data handling practices
  static validateDataHandling(data: any): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Check for prohibited data storage
    const dataString = JSON.stringify(data);
    
    if (securityUtils.containsSensitiveData(dataString)) {
      violations.push('Sensitive data detected in request');
    }
    
    // Check data classification
    if (this.containsRestrictedData(data)) {
      violations.push('Restricted data requires additional protection');
    }
    
    return {
      valid: violations.length === 0,
      violations,
    };
  }
  
  // Check if data contains restricted information
  private static containsRestrictedData(data: any): boolean {
    const restrictedFields = [
      'cardNumber',
      'cvv',
      'pin',
      'magneticStripe',
      'trackData',
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return restrictedFields.some(field => dataString.includes(field.toLowerCase()));
  }
}

export default securityMiddleware;
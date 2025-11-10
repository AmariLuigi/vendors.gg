// Security Configuration for PCI DSS Compliance
// Implements security measures for payment data protection

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
  };
  tokenization: {
    tokenLength: number;
    tokenPrefix: string;
    expirationHours: number;
  };
  audit: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
    sensitiveFields: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  validation: {
    strongPasswordRegex: RegExp;
    minPasswordLength: number;
    maxLoginAttempts: number;
    lockoutDurationMs: number;
  };
  compliance: {
    pciDssLevel: 1 | 2 | 3 | 4;
    dataRetentionDays: number;
    requireTwoFactor: boolean;
    allowedCountries: string[];
  };
}

// PCI DSS Compliant Security Configuration
export const securityConfig: SecurityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,  // 128 bits
    saltLength: 32, // 256 bits
  },
  
  tokenization: {
    tokenLength: 16,
    tokenPrefix: 'tok_',
    expirationHours: 24,
  },
  
  audit: {
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    retentionDays: 365, // PCI DSS requirement: 1 year minimum
    sensitiveFields: [
      'cardNumber',
      'cvv',
      'expiryDate',
      'accountNumber',
      'routingNumber',
      'ssn',
      'taxId',
      'password',
      'token',
      'apiKey',
    ],
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Relax rate limits during development to avoid interfering with HMR/prefetch
    maxRequests: process.env.NODE_ENV === 'production' ? 100 : 5000,
    skipSuccessfulRequests: false,
  },
  
  validation: {
    strongPasswordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    minPasswordLength: 12,
    maxLoginAttempts: 5,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  
  compliance: {
    pciDssLevel: 1, // Highest level of compliance
    dataRetentionDays: 90, // Minimize data retention
    requireTwoFactor: true,
    allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'], // Configurable based on business needs
  },
};

// Security Headers Configuration
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
  ].join(', '),
};

// Sensitive Data Patterns for Detection and Masking
export const sensitiveDataPatterns = {
  creditCard: {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    diners: /^3[0689][0-9]{11}$/,
    jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
  },
  
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  
  bankAccount: /^\d{8,17}$/,
  
  routingNumber: /^\d{9}$/,
  
  // API keys and tokens
  stripeKey: /^(sk|pk)_(test|live)_[a-zA-Z0-9]{24,}$/,
  
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
};

// Data Classification Levels
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted', // PCI data, PII
}

// Security Risk Levels
export enum SecurityRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// PCI DSS Data Storage Requirements
export const pciDataStorageRules = {
  // Prohibited data that must NEVER be stored
  prohibitedData: [
    'full_magnetic_stripe',
    'cav2_cvc2_cvv2_cid', // Card verification codes
    'pin_pin_block',
  ],
  
  // Data that can be stored but must be protected
  protectedData: [
    'primary_account_number', // Must be masked or encrypted
    'cardholder_name',
    'expiration_date',
    'service_code',
  ],
  
  // Encryption requirements
  encryptionRequirements: {
    atRest: true, // All stored cardholder data must be encrypted
    inTransit: true, // All transmission must use strong cryptography
    keyManagement: true, // Proper key management procedures
  },
  
  // Access control requirements
  accessControl: {
    needToKnow: true, // Restrict access to cardholder data by business need-to-know
    uniqueIds: true, // Assign a unique ID to each person with computer access
    authentication: 'multi_factor', // Use multi-factor authentication
  },
};

// Security Monitoring Configuration
export const securityMonitoring = {
  // Events to monitor and log
  monitoredEvents: [
    'payment_processing',
    'card_data_access',
    'authentication_attempts',
    'authorization_failures',
    'data_export',
    'configuration_changes',
    'user_privilege_changes',
    'system_access',
  ],
  
  // Alert thresholds
  alertThresholds: {
    failedLogins: 5, // Alert after 5 failed login attempts
    suspiciousTransactions: 3, // Alert after 3 suspicious transactions
    dataAccessVolume: 100, // Alert if more than 100 records accessed in 1 hour
    apiRateLimit: 1000, // Alert if API rate limit exceeded
  },
  
  // Real-time monitoring rules
  realTimeRules: [
    {
      name: 'multiple_failed_payments',
      condition: 'failed_payments > 3 in 10 minutes',
      action: 'block_user_temporarily',
      severity: SecurityRiskLevel.HIGH,
    },
    {
      name: 'unusual_transaction_pattern',
      condition: 'transaction_amount > average * 5',
      action: 'require_additional_verification',
      severity: SecurityRiskLevel.MEDIUM,
    },
    {
      name: 'suspicious_location',
      condition: 'login_from_new_country',
      action: 'require_two_factor_auth',
      severity: SecurityRiskLevel.MEDIUM,
    },
  ],
};

// Compliance Validation Rules
export const complianceValidation = {
  // PCI DSS Requirements Checklist
  pciRequirements: [
    {
      requirement: '1.1',
      description: 'Install and maintain a firewall configuration',
      implemented: true,
    },
    {
      requirement: '2.1',
      description: 'Always change vendor-supplied defaults',
      implemented: true,
    },
    {
      requirement: '3.4',
      description: 'Render PAN unreadable anywhere it is stored',
      implemented: true,
    },
    {
      requirement: '4.1',
      description: 'Use strong cryptography and security protocols',
      implemented: true,
    },
    {
      requirement: '6.5',
      description: 'Address common vulnerabilities in development',
      implemented: true,
    },
    {
      requirement: '8.2',
      description: 'Ensure proper user authentication management',
      implemented: true,
    },
    {
      requirement: '10.1',
      description: 'Implement audit trails',
      implemented: true,
    },
    {
      requirement: '11.2',
      description: 'Run internal and external network vulnerability scans',
      implemented: false, // Requires external security scanning
    },
  ],
  
  // Data retention policies
  dataRetention: {
    transactionLogs: 365, // days
    auditLogs: 365, // days
    paymentData: 90, // days (minimize retention)
    userSessions: 30, // days
    errorLogs: 180, // days
  },
  
  // Required security controls
  securityControls: [
    'encryption_at_rest',
    'encryption_in_transit',
    'access_logging',
    'multi_factor_authentication',
    'regular_security_testing',
    'vulnerability_management',
    'incident_response_plan',
    'security_awareness_training',
  ],
};

// Export utility functions for security validation
export const securityUtils = {
  // Check if data contains sensitive information
  containsSensitiveData: (data: string): boolean => {
    return Object.values(sensitiveDataPatterns).some(pattern => {
      if (typeof pattern === 'object' && !(pattern instanceof RegExp)) {
        return Object.values(pattern).some((p: RegExp) => p.test(data));
      }
      return (pattern as RegExp).test(data);
    });
  },
  
  // Mask sensitive data for logging
  maskSensitiveData: (data: string): string => {
    let maskedData = data;
    
    // Mask credit card numbers
    Object.values(sensitiveDataPatterns.creditCard).forEach(pattern => {
      maskedData = maskedData.replace(pattern, (match) => {
        return match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4);
      });
    });
    
    // Mask other sensitive patterns
    maskedData = maskedData.replace(sensitiveDataPatterns.ssn, 'XXX-XX-XXXX');
    maskedData = maskedData.replace(sensitiveDataPatterns.email, (match) => {
      const [local, domain] = match.split('@');
      return local.charAt(0) + '*'.repeat(local.length - 1) + '@' + domain;
    });
    
    return maskedData;
  },
  
  // Validate security compliance
  validateCompliance: (): { passed: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check environment variables
    const requiredEnvVars = [
      'ENCRYPTION_KEY',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'DATABASE_URL',
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    });
    
    // Check PCI requirements
    const failedRequirements = complianceValidation.pciRequirements
      .filter(req => !req.implemented)
      .map(req => `PCI DSS ${req.requirement}: ${req.description}`);
    
    issues.push(...failedRequirements);
    
    return {
      passed: issues.length === 0,
      issues,
    };
  },
};

export default securityConfig;
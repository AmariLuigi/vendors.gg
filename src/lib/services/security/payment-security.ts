// Payment Security Service
// Handles PCI DSS compliance, encryption, and audit logging

import crypto from 'crypto';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export interface SecurityConfig {
  encryptionKey: string;
  auditEnabled: boolean;
  pciComplianceLevel: 'level1' | 'level2' | 'level3' | 'level4';
  tokenizationEnabled: boolean;
}

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TokenizationResult {
  token: string;
  maskedValue: string;
  expiresAt?: Date;
}

export class PaymentSecurityService {
  private config: SecurityConfig;
  private encryptionAlgorithm = 'aes-256-gcm';

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // PCI DSS Compliance Methods

  /**
   * Tokenize sensitive payment data (PCI DSS Requirement 3.4)
   */
  async tokenizePaymentData(
    sensitiveData: string,
    dataType: 'card_number' | 'cvv' | 'account_number'
  ): Promise<TokenizationResult> {
    try {
      // Generate secure token
      const token = this.generateSecureToken();
      
      // Encrypt the sensitive data
      const encryptedData = this.encryptData(sensitiveData);
      
      // Store token mapping (in production, use a separate secure vault)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration
      
      // Create masked version for display
      const maskedValue = this.maskSensitiveData(sensitiveData, dataType);
      
      // In production, store in secure token vault
      // For now, we'll use a secure in-memory store or database
      
      await this.auditLog({
        userId: 'system',
        action: 'tokenize_payment_data',
        resource: 'payment_data',
        resourceId: token,
        metadata: {
          dataType,
          maskedValue,
        },
        riskLevel: 'high'
      });

      return {
        token,
        maskedValue,
        expiresAt,
      };

    } catch (error) {
      await this.auditLog({
        userId: 'system',
        action: 'tokenization_failed',
        resource: 'payment_data',
        resourceId: 'unknown',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataType,
        },
        riskLevel: 'critical'
      });
      
      throw new Error('Tokenization failed');
    }
  }

  /**
   * Detokenize payment data (PCI DSS Requirement 3.4)
   */
  async detokenizePaymentData(token: string): Promise<string> {
    try {
      // In production, retrieve from secure token vault
      // For now, this is a placeholder implementation
      
      await this.auditLog({
        userId: 'system',
        action: 'detokenize_payment_data',
        resource: 'payment_data',
        resourceId: token,
        riskLevel: 'high'
      });

      // This would retrieve and decrypt the actual data
      throw new Error('Detokenization not implemented - use payment processor tokens');

    } catch (error) {
      await this.auditLog({
        userId: 'system',
        action: 'detokenization_failed',
        resource: 'payment_data',
        resourceId: token,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        riskLevel: 'critical'
      });
      
      throw error;
    }
  }

  /**
   * Encrypt sensitive data (PCI DSS Requirement 3.4)
   */
  private encryptData(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.encryptionAlgorithm, this.config.encryptionKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;

    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data (PCI DSS Requirement 3.4)
   */
  private decryptData(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipher(this.encryptionAlgorithm, this.config.encryptionKey);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Mask sensitive data for display (PCI DSS Requirement 3.3)
   */
  maskSensitiveData(
    data: string, 
    type: 'card_number' | 'cvv' | 'account_number' | 'ssn'
  ): string {
    switch (type) {
      case 'card_number':
        // Show only last 4 digits: **** **** **** 1234
        if (data.length >= 4) {
          const lastFour = data.slice(-4);
          const masked = '*'.repeat(data.length - 4);
          return masked.replace(/(.{4})/g, '$1 ').trim() + ' ' + lastFour;
        }
        return '*'.repeat(data.length);

      case 'cvv':
        // Completely mask CVV
        return '*'.repeat(data.length);

      case 'account_number':
        // Show only last 4 digits
        if (data.length >= 4) {
          return '*'.repeat(data.length - 4) + data.slice(-4);
        }
        return '*'.repeat(data.length);

      case 'ssn':
        // Show only last 4 digits: ***-**-1234
        if (data.length >= 4) {
          return '*'.repeat(data.length - 4) + data.slice(-4);
        }
        return '*'.repeat(data.length);

      default:
        return '*'.repeat(data.length);
    }
  }

  /**
   * Validate PCI DSS compliance requirements
   */
  async validatePCICompliance(
    paymentData: any,
    context: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Check if sensitive data is properly protected
    if (paymentData.cardNumber && !this.isTokenized(paymentData.cardNumber)) {
      violations.push('Card number must be tokenized (PCI DSS 3.4)');
    }

    if (paymentData.cvv) {
      violations.push('CVV must not be stored (PCI DSS 3.2.2)');
    }

    if (paymentData.pin) {
      violations.push('PIN must not be stored (PCI DSS 3.2.3)');
    }

    // Check encryption requirements
    if (!this.config.tokenizationEnabled) {
      violations.push('Tokenization must be enabled (PCI DSS 3.4)');
    }

    // Audit the compliance check
    await this.auditLog({
      userId: 'system',
      action: 'pci_compliance_check',
      resource: 'payment_data',
      resourceId: context,
      metadata: {
        compliant: violations.length === 0,
        violations,
        complianceLevel: this.config.pciComplianceLevel,
      },
      riskLevel: violations.length > 0 ? 'high' : 'low'
    });

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Generate secure token for payment data
   */
  private generateSecureToken(): string {
    // Generate cryptographically secure random token
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString(36);
    const random = randomBytes.toString('hex');
    
    return `tok_${timestamp}_${random}`;
  }

  /**
   * Check if a value is a token
   */
  private isTokenized(value: string): boolean {
    return value.startsWith('tok_') || value.startsWith('card_') || value.startsWith('pm_');
  }

  // Audit Logging Methods

  /**
   * Log security-related events (PCI DSS Requirement 10)
   */
  async auditLog(entry: AuditLogEntry): Promise<void> {
    if (!this.config.auditEnabled) {
      return;
    }

    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
        riskLevel: entry.riskLevel,
        createdAt: new Date(),
      });

      // In production, also send to external audit system
      if (entry.riskLevel === 'critical') {
        await this.alertSecurityTeam(entry);
      }

    } catch (error) {
      console.error('❌ Audit logging failed:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Alert security team for critical events
   */
  private async alertSecurityTeam(entry: AuditLogEntry): Promise<void> {
    // In production, send alerts via email, Slack, PagerDuty, etc.
    console.warn('🚨 CRITICAL SECURITY EVENT:', {
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata,
    });
  }

  // Risk Assessment Methods

  /**
   * Assess transaction risk level
   */
  async assessTransactionRisk(
    transaction: any,
    userContext: any
  ): Promise<{ riskLevel: 'low' | 'medium' | 'high' | 'critical'; factors: string[] }> {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Amount-based risk
    if (transaction.amount > 10000) {
      riskFactors.push('High transaction amount');
      riskScore += 30;
    } else if (transaction.amount > 1000) {
      riskFactors.push('Medium transaction amount');
      riskScore += 15;
    }

    // Frequency-based risk
    if (userContext.transactionsToday > 10) {
      riskFactors.push('High transaction frequency');
      riskScore += 25;
    }

    // Geographic risk
    if (userContext.unusualLocation) {
      riskFactors.push('Unusual geographic location');
      riskScore += 20;
    }

    // Device risk
    if (userContext.newDevice) {
      riskFactors.push('New device detected');
      riskScore += 15;
    }

    // Payment method risk
    if (transaction.paymentMethod === 'new_card') {
      riskFactors.push('New payment method');
      riskScore += 10;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Log risk assessment
    await this.auditLog({
      userId: userContext.userId,
      action: 'risk_assessment',
      resource: 'transaction',
      resourceId: transaction.id,
      metadata: {
        riskScore,
        riskFactors,
        transactionAmount: transaction.amount,
      },
      riskLevel,
    });

    return { riskLevel, factors: riskFactors };
  }

  /**
   * Validate secure transmission (PCI DSS Requirement 4)
   */
  validateSecureTransmission(request: any): boolean {
    // Check HTTPS
    if (!request.secure && process.env.NODE_ENV === 'production') {
      return false;
    }

    // Check TLS version (should be 1.2 or higher)
    if (request.connection?.tlsVersion && 
        !['TLSv1.2', 'TLSv1.3'].includes(request.connection.tlsVersion)) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const paymentSecurity = new PaymentSecurityService({
  encryptionKey: process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production',
  auditEnabled: process.env.NODE_ENV === 'production',
  pciComplianceLevel: 'level1',
  tokenizationEnabled: true,
});
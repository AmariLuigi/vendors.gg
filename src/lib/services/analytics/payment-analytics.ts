// Payment Analytics Service
// Provides comprehensive payment metrics, reporting, and insights

import { db } from '@/lib/db';
import { paymentTransactions, orders, escrowHolds, refunds, disputes, accounts } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, sql, count, sum, avg } from 'drizzle-orm';
import { paymentSecurity } from '../security/payment-security';

export interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface PaymentMetrics {
  totalVolume: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  failureRate: number;
  disputeRate: number;
  refundRate: number;
  escrowHoldAmount: number;
  topPaymentMethods: PaymentMethodMetric[];
  revenueByPeriod: RevenueDataPoint[];
  transactionsByStatus: StatusMetric[];
}

export interface PaymentMethodMetric {
  method: string;
  count: number;
  volume: number;
  successRate: number;
}

export interface RevenueDataPoint {
  period: string;
  volume: number;
  transactions: number;
  averageValue: number;
}

export interface StatusMetric {
  status: string;
  count: number;
  percentage: number;
}

export interface UserAnalytics {
  userId: string;
  totalSpent: number;
  totalEarned: number;
  transactionCount: number;
  averageOrderValue: number;
  disputeCount: number;
  successfulTransactions: number;
  failedTransactions: number;
  riskScore: number;
}

export interface MarketplaceMetrics {
  totalGMV: number; // Gross Merchandise Value
  totalCommission: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: CategoryMetric[];
  topSellers: SellerMetric[];
}

export interface CategoryMetric {
  category: string;
  volume: number;
  transactions: number;
  averageValue: number;
}

export interface SellerMetric {
  sellerId: string;
  sellerName: string;
  volume: number;
  transactions: number;
  rating: number;
  disputeRate: number;
}

export class PaymentAnalyticsService {

  /**
   * Get comprehensive payment metrics for a timeframe
   */
  async getPaymentMetrics(timeframe: AnalyticsTimeframe): Promise<PaymentMetrics> {
    try {
      const { startDate, endDate } = timeframe;

      // Get basic transaction metrics
      const transactionMetrics = await db
        .select({
          totalVolume: sum(paymentTransactions.amount),
          totalTransactions: count(paymentTransactions.id),
          averageValue: avg(paymentTransactions.amount),
        })
        .from(paymentTransactions)
        .where(
          and(
            gte(paymentTransactions.createdAt, startDate),
            lte(paymentTransactions.createdAt, endDate)
          )
        );

      // Get success/failure rates
      const statusMetrics = await db
        .select({
          status: paymentTransactions.status,
          count: count(paymentTransactions.id),
        })
        .from(paymentTransactions)
        .where(
          and(
            gte(paymentTransactions.createdAt, startDate),
            lte(paymentTransactions.createdAt, endDate)
          )
        )
        .groupBy(paymentTransactions.status);

      // Get dispute metrics
      const disputeMetrics = await db
        .select({
          totalDisputes: count(disputes.id),
        })
        .from(disputes)
        .innerJoin(orders, eq(disputes.orderId, orders.id))
        .where(
          and(
            gte(disputes.createdAt, startDate),
            lte(disputes.createdAt, endDate)
          )
        );

      // Get refund metrics
      const refundMetrics = await db
        .select({
          totalRefunds: count(refunds.id),
          totalRefundAmount: sum(refunds.amount),
        })
        .from(refunds)
        .where(
          and(
            gte(refunds.createdAt, startDate),
            lte(refunds.createdAt, endDate)
          )
        );

      // Get escrow metrics
      const escrowMetrics = await db
        .select({
          totalEscrowAmount: sum(escrowHolds.amount),
        })
        .from(escrowHolds)
        .where(
          and(
            gte(escrowHolds.createdAt, startDate),
            lte(escrowHolds.createdAt, endDate),
            eq(escrowHolds.status, 'held')
          )
        );

      // Get payment method metrics
      const paymentMethodMetrics = await this.getPaymentMethodMetrics(timeframe);

      // Get revenue by period
      const revenueByPeriod = await this.getRevenueByPeriod(timeframe);

      // Calculate rates
      const totalTx = transactionMetrics[0]?.totalTransactions || 0;
      const successfulTx = statusMetrics.find(s => s.status === 'completed')?.count || 0;
      const failedTx = statusMetrics.find(s => s.status === 'failed')?.count || 0;
      const totalDisputes = disputeMetrics[0]?.totalDisputes || 0;
      const totalRefunds = refundMetrics[0]?.totalRefunds || 0;

      const successRate = totalTx > 0 ? (successfulTx / totalTx) * 100 : 0;
      const failureRate = totalTx > 0 ? (failedTx / totalTx) * 100 : 0;
      const disputeRate = totalTx > 0 ? (totalDisputes / totalTx) * 100 : 0;
      const refundRate = totalTx > 0 ? (totalRefunds / totalTx) * 100 : 0;

      // Transform status metrics
      const transactionsByStatus: StatusMetric[] = statusMetrics.map(metric => ({
        status: metric.status,
        count: metric.count,
        percentage: totalTx > 0 ? (metric.count / totalTx) * 100 : 0,
      }));

      return {
        totalVolume: Number(transactionMetrics[0]?.totalVolume || 0),
        totalTransactions: totalTx,
        averageTransactionValue: Number(transactionMetrics[0]?.averageValue || 0),
        successRate,
        failureRate,
        disputeRate,
        refundRate,
        escrowHoldAmount: Number(escrowMetrics[0]?.totalEscrowAmount || 0),
        topPaymentMethods: paymentMethodMetrics,
        revenueByPeriod,
        transactionsByStatus,
      };

    } catch (error) {
      console.error('❌ Get payment metrics error:', error);
      throw error;
    }
  }

  /**
   * Get payment method performance metrics
   */
  async getPaymentMethodMetrics(timeframe: AnalyticsTimeframe): Promise<PaymentMethodMetric[]> {
    try {
      const { startDate, endDate } = timeframe;

      const methodMetrics = await db
        .select({
          provider: paymentTransactions.provider,
          totalCount: count(paymentTransactions.id),
          totalVolume: sum(paymentTransactions.amount),
          successfulCount: sql<number>`COUNT(CASE WHEN ${paymentTransactions.status} = 'completed' THEN 1 END)`,
        })
        .from(paymentTransactions)
        .where(
          and(
            gte(paymentTransactions.createdAt, startDate),
            lte(paymentTransactions.createdAt, endDate)
          )
        )
        .groupBy(paymentTransactions.provider)
        .orderBy(desc(sql`${sum(paymentTransactions.amount)}`));

      return methodMetrics.map(metric => ({
        method: metric.provider,
        count: metric.totalCount,
        volume: Number(metric.totalVolume || 0),
        successRate: metric.totalCount > 0 ? (metric.successfulCount / metric.totalCount) * 100 : 0,
      }));

    } catch (error) {
      console.error('❌ Get payment method metrics error:', error);
      throw error;
    }
  }

  /**
   * Get revenue data by time period
   */
  async getRevenueByPeriod(timeframe: AnalyticsTimeframe): Promise<RevenueDataPoint[]> {
    try {
      const { startDate, endDate, granularity } = timeframe;

      // Build date truncation based on granularity
      let dateTrunc: any;
      let dateFormat: string;

      switch (granularity) {
        case 'hour':
          dateTrunc = sql`DATE_TRUNC('hour', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY-MM-DD HH24:00';
          break;
        case 'day':
          dateTrunc = sql`DATE_TRUNC('day', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateTrunc = sql`DATE_TRUNC('week', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'month':
          dateTrunc = sql`DATE_TRUNC('month', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY-MM';
          break;
        case 'year':
          dateTrunc = sql`DATE_TRUNC('year', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY';
          break;
        default:
          dateTrunc = sql`DATE_TRUNC('day', ${paymentTransactions.createdAt})`;
          dateFormat = 'YYYY-MM-DD';
      }

      const revenueData = await db
        .select({
          period: sql<string>`TO_CHAR(${dateTrunc}, '${dateFormat}')`,
          volume: sum(paymentTransactions.amount),
          transactions: count(paymentTransactions.id),
          averageValue: avg(paymentTransactions.amount),
        })
        .from(paymentTransactions)
        .where(
          and(
            gte(paymentTransactions.createdAt, startDate),
            lte(paymentTransactions.createdAt, endDate),
            eq(paymentTransactions.status, 'completed')
          )
        )
        .groupBy(dateTrunc)
        .orderBy(asc(dateTrunc));

      return revenueData.map(data => ({
        period: data.period,
        volume: Number(data.volume || 0),
        transactions: data.transactions,
        averageValue: Number(data.averageValue || 0),
      }));

    } catch (error) {
      console.error('❌ Get revenue by period error:', error);
      throw error;
    }
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(userId: string, timeframe?: AnalyticsTimeframe): Promise<UserAnalytics> {
    try {
      let whereConditions = [];

      if (timeframe) {
        whereConditions.push(
          gte(paymentTransactions.createdAt, timeframe.startDate),
          lte(paymentTransactions.createdAt, timeframe.endDate)
        );
      }

      // Get transactions where user is buyer
      const buyerMetrics = await db
        .select({
          totalSpent: sum(paymentTransactions.amount),
          transactionCount: count(paymentTransactions.id),
          successfulCount: sql<number>`COUNT(CASE WHEN ${paymentTransactions.status} = 'completed' THEN 1 END)`,
          failedCount: sql<number>`COUNT(CASE WHEN ${paymentTransactions.status} = 'failed' THEN 1 END)`,
        })
        .from(paymentTransactions)
        .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
        .where(
          and(
            eq(orders.buyerId, userId),
            ...whereConditions
          )
        );

      // Get transactions where user is seller
      const sellerMetrics = await db
        .select({
          totalEarned: sum(paymentTransactions.amount),
        })
        .from(paymentTransactions)
        .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
        .where(
          and(
            eq(orders.sellerId, userId),
            eq(paymentTransactions.status, 'completed'),
            ...whereConditions
          )
        );

      // Get dispute count
      const disputeCount = await db
        .select({
          count: count(disputes.id),
        })
        .from(disputes)
        .innerJoin(orders, eq(disputes.orderId, orders.id))
        .where(
          and(
            sql`(${orders.buyerId} = ${userId} OR ${orders.sellerId} = ${userId})`,
            ...(timeframe ? [
              gte(disputes.createdAt, timeframe.startDate),
              lte(disputes.createdAt, timeframe.endDate)
            ] : [])
          )
        );

      const totalSpent = Number(buyerMetrics[0]?.totalSpent || 0);
      const totalEarned = Number(sellerMetrics[0]?.totalEarned || 0);
      const transactionCount = buyerMetrics[0]?.transactionCount || 0;
      const successfulTransactions = buyerMetrics[0]?.successfulCount || 0;
      const failedTransactions = buyerMetrics[0]?.failedCount || 0;
      const userDisputeCount = disputeCount[0]?.count || 0;

      // Calculate risk score based on various factors
      const riskScore = await this.calculateUserRiskScore({
        userId,
        totalSpent,
        totalEarned,
        transactionCount,
        disputeCount: userDisputeCount,
        successfulTransactions,
        failedTransactions,
      });

      return {
        userId,
        totalSpent,
        totalEarned,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? totalSpent / transactionCount : 0,
        disputeCount: userDisputeCount,
        successfulTransactions,
        failedTransactions,
        riskScore,
      };

    } catch (error) {
      console.error('❌ Get user analytics error:', error);
      throw error;
    }
  }

  /**
   * Calculate user risk score
   */
  private async calculateUserRiskScore(userData: {
    userId: string;
    totalSpent: number;
    totalEarned: number;
    transactionCount: number;
    disputeCount: number;
    successfulTransactions: number;
    failedTransactions: number;
  }): Promise<number> {
    let riskScore = 0;

    // Dispute rate factor (0-40 points)
    const disputeRate = userData.transactionCount > 0 ? 
      (userData.disputeCount / userData.transactionCount) * 100 : 0;
    
    if (disputeRate > 20) riskScore += 40;
    else if (disputeRate > 10) riskScore += 25;
    else if (disputeRate > 5) riskScore += 15;
    else if (disputeRate > 2) riskScore += 5;

    // Failure rate factor (0-30 points)
    const failureRate = userData.transactionCount > 0 ? 
      (userData.failedTransactions / userData.transactionCount) * 100 : 0;
    
    if (failureRate > 30) riskScore += 30;
    else if (failureRate > 20) riskScore += 20;
    else if (failureRate > 10) riskScore += 10;
    else if (failureRate > 5) riskScore += 5;

    // Transaction volume factor (0-20 points)
    if (userData.totalSpent > 50000) riskScore += 20;
    else if (userData.totalSpent > 20000) riskScore += 15;
    else if (userData.totalSpent > 10000) riskScore += 10;

    // New user factor (0-10 points)
    if (userData.transactionCount < 5) riskScore += 10;
    else if (userData.transactionCount < 10) riskScore += 5;

    // Cap at 100
    return Math.min(riskScore, 100);
  }

  /**
   * Get marketplace-wide metrics
   */
  async getMarketplaceMetrics(timeframe: AnalyticsTimeframe): Promise<MarketplaceMetrics> {
    try {
      const { startDate, endDate } = timeframe;

      // Get GMV and commission
      const gmvMetrics = await db
        .select({
          totalGMV: sum(paymentTransactions.amount),
          totalTransactions: count(paymentTransactions.id),
        })
        .from(paymentTransactions)
        .where(
          and(
            gte(paymentTransactions.createdAt, startDate),
            lte(paymentTransactions.createdAt, endDate),
            eq(paymentTransactions.status, 'completed')
          )
        );

      // Calculate commission (assuming 5% marketplace fee)
      const totalGMV = Number(gmvMetrics[0]?.totalGMV || 0);
      const totalCommission = totalGMV * 0.05;

      // Get user metrics
      const userMetrics = await db
        .select({
          activeUsers: sql<number>`COUNT(DISTINCT ${orders.buyerId})`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      // Get new users (simplified - users who made their first order in this period)
      const newUserMetrics = await db
        .select({
          newUsers: count(sql`DISTINCT ${orders.buyerId}`),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      const activeUsers = userMetrics[0]?.activeUsers || 0;
      const newUsers = newUserMetrics[0]?.newUsers || 0;
      const totalTransactions = gmvMetrics[0]?.totalTransactions || 0;

      return {
        totalGMV,
        totalCommission,
        activeUsers,
        newUsers,
        retentionRate: activeUsers > 0 ? ((activeUsers - newUsers) / activeUsers) * 100 : 0,
        averageOrderValue: totalTransactions > 0 ? totalGMV / totalTransactions : 0,
        conversionRate: 0, // Would need additional data to calculate
        topCategories: [], // Would need category data
        topSellers: [], // Would need seller performance data
      };

    } catch (error) {
      console.error('❌ Get marketplace metrics error:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(
    timeframe: AnalyticsTimeframe,
    includeUserAnalytics: boolean = false
  ): Promise<any> {
    try {
      // Audit the report generation
      await paymentSecurity.auditLog({
        userId: 'system',
        action: 'generate_analytics_report',
        resource: 'analytics',
        resourceId: `${timeframe.startDate.toISOString()}_${timeframe.endDate.toISOString()}`,
        metadata: {
          timeframe,
          includeUserAnalytics,
        },
        riskLevel: 'low'
      });

      const [paymentMetrics, marketplaceMetrics] = await Promise.all([
        this.getPaymentMetrics(timeframe),
        this.getMarketplaceMetrics(timeframe),
      ]);

      const report = {
        generatedAt: new Date(),
        timeframe,
        paymentMetrics,
        marketplaceMetrics,
        summary: {
          totalRevenue: paymentMetrics.totalVolume,
          totalTransactions: paymentMetrics.totalTransactions,
          averageOrderValue: paymentMetrics.averageTransactionValue,
          successRate: paymentMetrics.successRate,
          disputeRate: paymentMetrics.disputeRate,
          activeUsers: marketplaceMetrics.activeUsers,
          newUsers: marketplaceMetrics.newUsers,
        }
      };

      return report;

    } catch (error) {
      console.error('❌ Generate analytics report error:', error);
      throw error;
    }
  }
}
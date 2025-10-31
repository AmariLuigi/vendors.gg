// Payment Analytics API Route
// Provides payment metrics, reports, and insights

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentAnalyticsService, AnalyticsTimeframe } from '@/lib/services/analytics/payment-analytics';
import { ApiResponse } from '@/lib/types/payment';
import { z } from 'zod';

// Validation schemas
const timeframeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  granularity: z.enum(['hour', 'day', 'week', 'month', 'year']).default('day'),
});

const analyticsQuerySchema = z.object({
  type: z.enum(['payment_metrics', 'user_analytics', 'marketplace_metrics', 'full_report']),
  timeframe: timeframeSchema,
  userId: z.string().uuid().optional(),
  includeUserAnalytics: z.boolean().default(false),
});

// GET /api/payments/analytics - Get payment analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const queryParams = {
      type: searchParams.get('type') || 'payment_metrics',
      timeframe: {
        startDate: searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: searchParams.get('endDate') || new Date().toISOString(),
        granularity: searchParams.get('granularity') || 'day',
      },
      userId: searchParams.get('userId'),
      includeUserAnalytics: searchParams.get('includeUserAnalytics') === 'true',
    };

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Convert string dates to Date objects
    const timeframe: AnalyticsTimeframe = {
      startDate: new Date(validatedQuery.timeframe.startDate),
      endDate: new Date(validatedQuery.timeframe.endDate),
      granularity: validatedQuery.timeframe.granularity,
    };

    const analyticsService = new PaymentAnalyticsService();

    // Route to appropriate analytics method based on type
    switch (validatedQuery.type) {
      case 'payment_metrics':
        return await handlePaymentMetrics(timeframe, analyticsService);
      
      case 'user_analytics':
        return await handleUserAnalytics(
          validatedQuery.userId || session.user.id, 
          timeframe, 
          analyticsService
        );
      
      case 'marketplace_metrics':
        return await handleMarketplaceMetrics(timeframe, analyticsService);
      
      case 'full_report':
        return await handleFullReport(
          timeframe, 
          validatedQuery.includeUserAnalytics, 
          analyticsService
        );
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Get analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/analytics - Generate custom analytics reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    const analyticsService = new PaymentAnalyticsService();

    switch (action) {
      case 'generate_report':
        return await handleGenerateReport(body, analyticsService);
      
      case 'export_data':
        return await handleExportData(body, analyticsService);
      
      case 'get_insights':
        return await handleGetInsights(body, analyticsService);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Analytics operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle payment metrics request
async function handlePaymentMetrics(
  timeframe: AnalyticsTimeframe,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const metrics = await analyticsService.getPaymentMetrics(timeframe);

    const response: ApiResponse = {
      success: true,
      data: {
        type: 'payment_metrics',
        timeframe,
        metrics,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Payment metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payment metrics' },
      { status: 500 }
    );
  }
}

// Handle user analytics request
async function handleUserAnalytics(
  userId: string,
  timeframe: AnalyticsTimeframe,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const analytics = await analyticsService.getUserAnalytics(userId, timeframe);

    const response: ApiResponse = {
      success: true,
      data: {
        type: 'user_analytics',
        timeframe,
        analytics,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ User analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user analytics' },
      { status: 500 }
    );
  }
}

// Handle marketplace metrics request
async function handleMarketplaceMetrics(
  timeframe: AnalyticsTimeframe,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const metrics = await analyticsService.getMarketplaceMetrics(timeframe);

    const response: ApiResponse = {
      success: true,
      data: {
        type: 'marketplace_metrics',
        timeframe,
        metrics,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Marketplace metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get marketplace metrics' },
      { status: 500 }
    );
  }
}

// Handle full report request
async function handleFullReport(
  timeframe: AnalyticsTimeframe,
  includeUserAnalytics: boolean,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const report = await analyticsService.generateAnalyticsReport(
      timeframe,
      includeUserAnalytics
    );

    const response: ApiResponse = {
      success: true,
      data: {
        type: 'full_report',
        report,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Full report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate full report' },
      { status: 500 }
    );
  }
}

// Handle generate report request
async function handleGenerateReport(
  body: any,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const { timeframe, reportType, filters } = body;

    if (!timeframe) {
      return NextResponse.json(
        { success: false, error: 'Timeframe is required' },
        { status: 400 }
      );
    }

    const parsedTimeframe: AnalyticsTimeframe = {
      startDate: new Date(timeframe.startDate),
      endDate: new Date(timeframe.endDate),
      granularity: timeframe.granularity || 'day',
    };

    let reportData;

    switch (reportType) {
      case 'payment_summary':
        reportData = await analyticsService.getPaymentMetrics(parsedTimeframe);
        break;
      
      case 'marketplace_overview':
        reportData = await analyticsService.getMarketplaceMetrics(parsedTimeframe);
        break;
      
      case 'comprehensive':
        reportData = await analyticsService.generateAnalyticsReport(parsedTimeframe, true);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportType,
        timeframe: parsedTimeframe,
        filters,
        report: reportData,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('❌ Generate report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Handle export data request
async function handleExportData(
  body: any,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const { timeframe, format, dataType } = body;

    if (!timeframe) {
      return NextResponse.json(
        { success: false, error: 'Timeframe is required' },
        { status: 400 }
      );
    }

    const parsedTimeframe: AnalyticsTimeframe = {
      startDate: new Date(timeframe.startDate),
      endDate: new Date(timeframe.endDate),
      granularity: timeframe.granularity || 'day',
    };

    // Get the requested data
    let exportData;
    
    switch (dataType) {
      case 'transactions':
        exportData = await analyticsService.getPaymentMetrics(parsedTimeframe);
        break;
      
      case 'revenue':
        const metrics = await analyticsService.getPaymentMetrics(parsedTimeframe);
        exportData = metrics.revenueByPeriod;
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid data type for export' },
          { status: 400 }
        );
    }

    // In a real implementation, you would format the data according to the requested format
    // For now, we'll return JSON format
    return NextResponse.json({
      success: true,
      message: 'Data exported successfully',
      data: {
        format: format || 'json',
        dataType,
        timeframe: parsedTimeframe,
        exportData,
        exportedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('❌ Export data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Handle get insights request
async function handleGetInsights(
  body: any,
  analyticsService: PaymentAnalyticsService
): Promise<NextResponse> {
  try {
    const { timeframe, insightType } = body;

    if (!timeframe) {
      return NextResponse.json(
        { success: false, error: 'Timeframe is required' },
        { status: 400 }
      );
    }

    const parsedTimeframe: AnalyticsTimeframe = {
      startDate: new Date(timeframe.startDate),
      endDate: new Date(timeframe.endDate),
      granularity: timeframe.granularity || 'day',
    };

    // Get metrics for insights
    const [paymentMetrics, marketplaceMetrics] = await Promise.all([
      analyticsService.getPaymentMetrics(parsedTimeframe),
      analyticsService.getMarketplaceMetrics(parsedTimeframe),
    ]);

    // Generate insights based on the data
    const insights = generateInsights(paymentMetrics, marketplaceMetrics, insightType);

    return NextResponse.json({
      success: true,
      data: {
        insightType,
        timeframe: parsedTimeframe,
        insights,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('❌ Get insights error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// Generate insights from metrics data
function generateInsights(paymentMetrics: any, marketplaceMetrics: any, insightType?: string): any[] {
  const insights = [];

  // Performance insights
  if (paymentMetrics.successRate < 95) {
    insights.push({
      type: 'warning',
      category: 'performance',
      title: 'Low Success Rate',
      message: `Payment success rate is ${paymentMetrics.successRate.toFixed(1)}%, which is below the recommended 95%`,
      recommendation: 'Review payment processing issues and consider optimizing payment flows',
      impact: 'high',
    });
  }

  if (paymentMetrics.disputeRate > 2) {
    insights.push({
      type: 'alert',
      category: 'risk',
      title: 'High Dispute Rate',
      message: `Dispute rate is ${paymentMetrics.disputeRate.toFixed(1)}%, which is above the recommended 2%`,
      recommendation: 'Investigate common dispute reasons and improve seller/buyer communication',
      impact: 'high',
    });
  }

  // Growth insights
  if (marketplaceMetrics.newUsers > marketplaceMetrics.activeUsers * 0.3) {
    insights.push({
      type: 'positive',
      category: 'growth',
      title: 'Strong User Acquisition',
      message: `New users represent ${((marketplaceMetrics.newUsers / marketplaceMetrics.activeUsers) * 100).toFixed(1)}% of active users`,
      recommendation: 'Focus on user retention strategies to convert new users to repeat customers',
      impact: 'medium',
    });
  }

  // Revenue insights
  if (paymentMetrics.averageTransactionValue > 0) {
    // Determine AOV trend based on current value (in real implementation, compare with previous period)
    const aovTrend: 'stable' | 'declining' | 'growing' = 
      paymentMetrics.averageTransactionValue < 50 ? 'declining' :
      paymentMetrics.averageTransactionValue > 100 ? 'growing' : 'stable';
    
    insights.push({
      type: 'info',
      category: 'revenue',
      title: 'Average Order Value',
      message: `Current AOV is $${paymentMetrics.averageTransactionValue.toFixed(2)}`,
      recommendation: aovTrend === 'declining' ? 'Consider upselling strategies or bundle offers' : 'Continue monitoring AOV trends',
      impact: 'medium',
    });
  }

  return insights;
}
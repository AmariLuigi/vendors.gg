// Dispute Resolution Service
// Handles transaction disputes and conflict resolution

import { db } from '@/lib/db';
import { disputes, disputeMessages, escrowHolds, orders, paymentTransactions, paymentNotifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { paymentSecurity } from '../security/payment-security';
import crypto from 'crypto';

export interface DisputeCreationData {
  orderId: string;
  escrowId?: string;
  reason: DisputeReason;
  description: string;
  evidence?: DisputeEvidence[];
  requestedAmount?: number;
  createdBy: string;
}

export interface DisputeEvidence {
  type: 'image' | 'document' | 'message' | 'tracking' | 'receipt';
  url: string;
  description: string;
  uploadedAt: Date;
}

export interface DisputeResolution {
  disputeId: string;
  resolution: DisputeResolutionType;
  amount?: number;
  reason: string;
  resolvedBy: string;
  evidence?: string;
}

export interface DisputeMessage {
  disputeId: string;
  senderId: string;
  message: string;
  attachments?: DisputeEvidence[];
  isInternal?: boolean; // For admin/mediator messages
}

export type DisputeReason = 
  | 'item_not_received'
  | 'item_not_as_described'
  | 'damaged_item'
  | 'wrong_item'
  | 'seller_not_responsive'
  | 'buyer_not_responsive'
  | 'payment_issue'
  | 'shipping_issue'
  | 'quality_issue'
  | 'other';

export type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'awaiting_response'
  | 'escalated'
  | 'resolved'
  | 'closed';

export type DisputeResolutionType = 
  | 'full_refund'
  | 'partial_refund'
  | 'replacement'
  | 'store_credit'
  | 'no_action'
  | 'favor_seller'
  | 'favor_buyer';

export class DisputeService {
  
  /**
   * Create a new dispute
   */
  async createDispute(data: DisputeCreationData): Promise<string> {
    try {
      // Validate order exists and user has permission
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, data.orderId),
        with: {
          buyer: true,
          seller: true,
          listing: true,
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if user is involved in the order
      if (order.buyerId !== data.createdBy && order.sellerId !== data.createdBy) {
        throw new Error('Unauthorized to create dispute for this order');
      }

      // Check if dispute already exists for this order
      const existingDispute = await db.query.disputes.findFirst({
        where: and(
          eq(disputes.orderId, data.orderId),
          eq(disputes.status, 'open' as any)
        )
      });

      if (existingDispute) {
        throw new Error('An active dispute already exists for this order');
      }

      // Create dispute
      const disputeId = crypto.randomUUID();
      const otherPartyId = order.buyerId === data.createdBy ? order.sellerId : order.buyerId;
      
      await db.insert(disputes).values({
        orderId: data.orderId,
        escrowId: data.escrowId,
        type: 'payment', // Default type, could be made configurable
        reason: data.reason,
        description: data.description,
        status: 'open',
        createdBy: data.createdBy,
        initiatedBy: data.createdBy,
        respondentId: otherPartyId,
        requestedAmount: data.requestedAmount?.toString() ?? null,
        evidence: data.evidence || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Notify the other party
      
      await db.insert(paymentNotifications).values({
        id: crypto.randomUUID(),
        userId: otherPartyId,
        type: 'dispute_created',
        title: 'New Dispute Created',
        message: `A dispute has been created for order #${order.orderNumber}`,
        metadata: {
          disputeId,
          orderId: data.orderId,
          reason: data.reason,
        },
        createdAt: new Date(),
      });

      // Update escrow status if applicable
      if (data.escrowId) {
        await db.update(escrowHolds)
          .set({
            status: 'disputed',
            updatedAt: new Date(),
          })
          .where(eq(escrowHolds.id, data.escrowId));
      }

      // Audit log
      await paymentSecurity.auditLog({
        userId: data.createdBy,
        action: 'dispute_created',
        resource: 'dispute',
        resourceId: disputeId,
        metadata: {
          orderId: data.orderId,
          reason: data.reason,
          requestedAmount: data.requestedAmount,
        },
        riskLevel: 'medium'
      });

      return disputeId;

    } catch (error) {
      console.error('❌ Create dispute error:', error);
      throw error;
    }
  }

  /**
   * Add message to dispute
   */
  async addDisputeMessage(data: DisputeMessage): Promise<void> {
    try {
      // Validate dispute exists and user has permission
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, data.disputeId),
        with: {
          order: true,
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const order = (dispute as any).order;
      
      // Check if user is involved in the dispute
      if (!data.isInternal && 
          order.buyerId !== data.senderId && 
          order.sellerId !== data.senderId) {
        throw new Error('Unauthorized to add message to this dispute');
      }

      // Add message
      await db.insert(disputeMessages).values({
        id: crypto.randomUUID(),
        disputeId: data.disputeId,
        senderId: data.senderId,
        message: data.message,
        attachments: data.attachments || [],
        isInternal: data.isInternal || false,
        createdAt: new Date(),
      });

      // Update dispute status
      await db.update(disputes)
        .set({
          status: 'awaiting_response',
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, data.disputeId));

      // Notify other party
      const otherPartyId = order.buyerId === data.senderId ? order.sellerId : order.buyerId;
      
      if (!data.isInternal) {
        await db.insert(paymentNotifications).values({
          id: crypto.randomUUID(),
          userId: otherPartyId,
          type: 'dispute_message',
          title: 'New Dispute Message',
          message: 'You have received a new message in your dispute',
          metadata: {
            disputeId: data.disputeId,
            senderId: data.senderId,
          },
          createdAt: new Date(),
        });
      }

      // Audit log
      await paymentSecurity.auditLog({
        userId: data.senderId,
        action: 'dispute_message_added',
        resource: 'dispute',
        resourceId: data.disputeId,
        metadata: {
          messageLength: data.message.length,
          hasAttachments: (data.attachments?.length || 0) > 0,
          isInternal: data.isInternal,
        },
        riskLevel: 'low'
      });

    } catch (error) {
      console.error('❌ Add dispute message error:', error);
      throw error;
    }
  }

  /**
   * Escalate dispute to admin/mediator
   */
  async escalateDispute(disputeId: string, userId: string, reason: string): Promise<void> {
    try {
      // Validate dispute exists and user has permission
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          order: true,
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const order = (dispute as any).order;
      
      // Check if user is involved in the dispute
      if (order.buyerId !== userId && order.sellerId !== userId) {
        throw new Error('Unauthorized to escalate this dispute');
      }

      // Update dispute status
      await db.update(disputes)
        .set({
          status: 'escalated',
          escalatedAt: new Date(),
          escalationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, disputeId));

      // Add internal message about escalation
      await this.addDisputeMessage({
        disputeId,
        senderId: 'system',
        message: `Dispute escalated by user. Reason: ${reason}`,
        isInternal: true,
      });

      // Notify admin team (in production, send to admin dashboard/email)
      console.log('🚨 Dispute escalated:', {
        disputeId,
        orderId: dispute.orderId,
        reason,
        escalatedBy: userId,
      });

      // Audit log
      await paymentSecurity.auditLog({
        userId,
        action: 'dispute_escalated',
        resource: 'dispute',
        resourceId: disputeId,
        metadata: {
          reason,
          orderId: dispute.orderId,
        },
        riskLevel: 'high'
      });

    } catch (error) {
      console.error('❌ Escalate dispute error:', error);
      throw error;
    }
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(data: DisputeResolution): Promise<void> {
    try {
      // Validate dispute exists
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, data.disputeId),
        with: {
          order: true,
          escrow: true,
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Update dispute with resolution
      await db.update(disputes)
        .set({
          status: 'resolved',
          resolution: data.resolution,
          resolutionAmount: data.amount?.toString() ?? null,
          resolutionNotes: data.reason,
          resolvedBy: data.resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, data.disputeId));

      // Execute resolution actions
      await this.executeResolution(dispute, data);

      // Notify parties
      const order = (dispute as any).order;
      
      for (const userId of [order.buyerId, order.sellerId]) {
        await db.insert(paymentNotifications).values({
          id: crypto.randomUUID(),
          userId,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          message: `Your dispute has been resolved: ${data.resolution}`,
          metadata: {
            disputeId: data.disputeId,
            resolution: data.resolution,
            amount: data.amount,
          },
          createdAt: new Date(),
        });
      }

      // Add resolution message
      await this.addDisputeMessage({
        disputeId: data.disputeId,
        senderId: data.resolvedBy,
        message: `Dispute resolved: ${data.resolution}. ${data.reason}`,
        isInternal: true,
      });

      // Audit log
      await paymentSecurity.auditLog({
        userId: data.resolvedBy,
        action: 'dispute_resolved',
        resource: 'dispute',
        resourceId: data.disputeId,
        metadata: {
          resolution: data.resolution,
          amount: data.amount,
          orderId: dispute.orderId,
        },
        riskLevel: 'medium'
      });

    } catch (error) {
      console.error('❌ Resolve dispute error:', error);
      throw error;
    }
  }

  /**
   * Execute resolution actions (refunds, releases, etc.)
   */
  private async executeResolution(dispute: any, resolution: DisputeResolution): Promise<void> {
    const order = dispute.order;
    const escrow = dispute.escrow;

    switch (resolution.resolution) {
      case 'full_refund':
        if (escrow) {
          // Refund full amount from escrow
          await this.processEscrowRefund(escrow.id, parseFloat(escrow.amount), 'Dispute resolution: full refund');
        }
        break;

      case 'partial_refund':
        if (escrow && resolution.amount) {
          // Refund partial amount from escrow
          await this.processEscrowRefund(escrow.id, resolution.amount, 'Dispute resolution: partial refund');
          
          // Release remaining amount to seller
          const remainingAmount = parseFloat(escrow.amount) - resolution.amount;
          if (remainingAmount > 0) {
            await this.processEscrowRelease(escrow.id, remainingAmount, 'Dispute resolution: partial release');
          }
        }
        break;

      case 'favor_seller':
        if (escrow) {
          // Release full amount to seller
          await this.processEscrowRelease(escrow.id, parseFloat(escrow.amount), 'Dispute resolution: favor seller');
        }
        break;

      case 'favor_buyer':
        if (escrow) {
          // Refund full amount to buyer
          await this.processEscrowRefund(escrow.id, parseFloat(escrow.amount), 'Dispute resolution: favor buyer');
        }
        break;

      case 'no_action':
        // No financial action needed
        break;

      default:
        console.warn('Unknown resolution type:', resolution.resolution);
    }
  }

  /**
   * Process escrow refund
   */
  private async processEscrowRefund(escrowId: string, amount: number, reason: string): Promise<void> {
    // This would integrate with the EscrowService
    // For now, just update the escrow status
    await db.update(escrowHolds)
      .set({
        status: 'refunded',
        releaseReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(escrowHolds.id, escrowId));
  }

  /**
   * Process escrow release
   */
  private async processEscrowRelease(escrowId: string, amount: number, reason: string): Promise<void> {
    // This would integrate with the EscrowService
    // For now, just update the escrow status
    await db.update(escrowHolds)
      .set({
        status: 'released',
        releaseReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(escrowHolds.id, escrowId));
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string, userId: string): Promise<any> {
    try {
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          order: {
            with: {
              buyer: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              },
              seller: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              },
              listing: {
                columns: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                }
              }
            }
          },
          escrow: true,
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const order = (dispute as any).order;
      
      // Check if user has permission to view dispute
      if (order.buyerId !== userId && order.sellerId !== userId) {
        throw new Error('Unauthorized to view this dispute');
      }

      // Get dispute messages
      const messages = await db.query.disputeMessages.findMany({
        where: eq(disputeMessages.disputeId, disputeId),
        orderBy: [desc(disputeMessages.createdAt)]
      });

      return {
        ...dispute,
        messages,
      };

    } catch (error) {
      console.error('❌ Get dispute error:', error);
      throw error;
    }
  }

  /**
   * Get user's disputes
   */
  async getUserDisputes(
    userId: string, 
    status?: DisputeStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions
      let whereConditions = [];
      
      if (status) {
        whereConditions.push(eq(disputes.status, status as any));
      }

      const userDisputes = await db.query.disputes.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          order: {
            with: {
              buyer: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              },
              seller: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              },
              listing: {
                columns: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                }
              }
            }
          }
        },
        orderBy: [desc(disputes.createdAt)],
        limit,
        offset,
      });

      // Filter disputes where user is involved
      const filteredDisputes = userDisputes.filter(dispute => {
        const order = dispute.order as any;
        return order.buyerId === userId || order.sellerId === userId;
      });

      return {
        disputes: filteredDisputes,
        pagination: {
          page,
          limit,
          total: filteredDisputes.length,
        }
      };

    } catch (error) {
      console.error('❌ Get user disputes error:', error);
      throw error;
    }
  }
}
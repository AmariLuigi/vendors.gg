// Escrow Service
// Manages secure transactions between buyers and sellers

import { db } from '@/lib/db';
import { escrowHolds, orders, paymentTransactions, accounts } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { EscrowStatus, OrderStatus } from '@/lib/types/payment';
import { getPaymentProvider } from '../payment/payment-factory';

export interface EscrowHold {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  autoReleaseAt?: Date;
  releaseCondition?: string;
  releasedAt?: Date;
  releasedBy?: string;
  releaseReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowReleaseRequest {
  escrowId: string;
  amount?: number; // Partial release amount
  reason: string;
  releasedBy: string;
}

export class EscrowService {
  
  /**
   * Create escrow hold after successful payment
   */
  async createEscrowHold(
    orderId: string,
    transactionId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<EscrowHold> {
    try {
      // Calculate auto-release date (default 7 days)
      const autoReleaseDays = parseInt(process.env.ESCROW_AUTO_RELEASE_DAYS || '7');
      const autoReleaseAt = new Date();
      autoReleaseAt.setDate(autoReleaseAt.getDate() + autoReleaseDays);

      const [escrowHold] = await db.insert(escrowHolds).values({
        orderId,
        transactionId,
        amount: amount.toString(),
        currency,
        status: 'held',
        autoReleaseAt,
        releaseCondition: 'buyer_confirmation_or_timeout',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return {
        ...escrowHold,
        amount: parseFloat(escrowHold.amount)
      } as EscrowHold;

    } catch (error) {
      console.error('❌ Create escrow hold error:', error);
      throw new Error('Failed to create escrow hold');
    }
  }

  /**
   * Release escrow funds to seller
   */
  async releaseEscrow(request: EscrowReleaseRequest): Promise<void> {
    try {
      const { escrowId, amount, reason, releasedBy } = request;

      // Get escrow hold with order and transaction details
      const escrowHold = await db.query.escrowHolds.findFirst({
        where: eq(escrowHolds.id, escrowId),
        with: {
          order: {
            with: {
              seller: true,
              buyer: true,
            }
          },
          transaction: true,
        }
      });

      if (!escrowHold) {
        throw new Error('Escrow hold not found');
      }

      if (escrowHold.status !== 'held') {
        throw new Error(`Cannot release escrow with status: ${escrowHold.status}`);
      }

      const escrowAmount = parseFloat(escrowHold.amount);
      const releaseAmount = amount || escrowAmount;
      
      if (releaseAmount > escrowAmount) {
        throw new Error('Release amount cannot exceed held amount');
      }

      // Get payment provider to process the release
      const paymentProvider = getPaymentProvider();
      
      // Capture the payment (release from escrow)
      await paymentProvider.capturePayment(
        escrowHold.transactionId,
        releaseAmount
      );

      // Update escrow status
      const newStatus: EscrowStatus = releaseAmount === escrowAmount ? 'released' : 'partial_release';
      
      await db
        .update(escrowHolds)
        .set({
          status: newStatus,
          releasedAt: new Date(),
          releasedBy,
          releaseReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(escrowHolds.id, escrowId));

      // Update order status if fully released
      if (newStatus === 'released') {
        await db
          .update(orders)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, escrowHold.orderId));
      }

      console.log(`✅ Escrow released: ${escrowId}, Amount: ${releaseAmount}`);

    } catch (error) {
      console.error('❌ Release escrow error:', error);
      throw new Error(`Failed to release escrow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-release expired escrow holds
   */
  async processAutoReleases(): Promise<void> {
    try {
      const now = new Date();

      // Find expired escrow holds
      const expiredHolds = await db.query.escrowHolds.findMany({
        where: and(
          eq(escrowHolds.status, 'held'),
          lt(escrowHolds.autoReleaseAt, now)
        ),
        with: {
          order: true,
        }
      });

      console.log(`🔄 Processing ${expiredHolds.length} auto-releases`);

      for (const hold of expiredHolds) {
        try {
          await this.releaseEscrow({
            escrowId: hold.id,
            reason: 'Auto-release timeout',
            releasedBy: 'system',
          });

          console.log(`✅ Auto-released escrow: ${hold.id}`);

        } catch (error) {
          console.error(`❌ Auto-release failed for escrow ${hold.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Process auto-releases error:', error);
    }
  }

  /**
   * Dispute escrow hold
   */
  async disputeEscrow(
    escrowId: string,
    disputeReason: string,
    disputedBy: string
  ): Promise<void> {
    try {
      // Update escrow status to disputed
      await db
        .update(escrowHolds)
        .set({
          status: 'disputed',
          updatedAt: new Date(),
        })
        .where(eq(escrowHolds.id, escrowId));

      // Update order status to disputed
      const escrowHold = await db.query.escrowHolds.findFirst({
        where: eq(escrowHolds.id, escrowId),
      });

      if (escrowHold) {
        await db
          .update(orders)
          .set({
            status: 'disputed',
            disputeReason,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, escrowHold.orderId));
      }

      console.log(`⚠️ Escrow disputed: ${escrowId}`);

    } catch (error) {
      console.error('❌ Dispute escrow error:', error);
      throw new Error('Failed to dispute escrow');
    }
  }

  /**
   * Refund escrow to buyer
   */
  async refundEscrow(
    escrowId: string,
    refundReason: string,
    refundedBy: string
  ): Promise<void> {
    try {
      const escrowHold = await db.query.escrowHolds.findFirst({
        where: eq(escrowHolds.id, escrowId),
        with: {
          transaction: true,
        }
      });

      if (!escrowHold) {
        throw new Error('Escrow hold not found');
      }

      if (escrowHold.status !== 'held' && escrowHold.status !== 'disputed') {
        throw new Error(`Cannot refund escrow with status: ${escrowHold.status}`);
      }

      // Process refund through payment provider
      const paymentProvider = getPaymentProvider();
      
      await paymentProvider.refundPayment(
        escrowHold.transactionId,
        parseFloat(escrowHold.amount)
      );

      // Update escrow status
      await db
        .update(escrowHolds)
        .set({
          status: 'refunded',
          releasedAt: new Date(),
          releasedBy: refundedBy,
          releaseReason: refundReason,
          updatedAt: new Date(),
        })
        .where(eq(escrowHolds.id, escrowId));

      // Update order status
      await db
        .update(orders)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, escrowHold.orderId));

      console.log(`💰 Escrow refunded: ${escrowId}`);

    } catch (error) {
      console.error('❌ Refund escrow error:', error);
      throw new Error(`Failed to refund escrow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(orderId: string): Promise<EscrowHold | null> {
    try {
      const escrowHold = await db.query.escrowHolds.findFirst({
        where: eq(escrowHolds.orderId, orderId),
      });

      if (!escrowHold) {
        return null;
      }

      // Convert amount from string to number to match EscrowHold interface
      return {
        ...escrowHold,
        amount: parseFloat(escrowHold.amount)
      } as EscrowHold;

    } catch (error) {
      console.error('❌ Get escrow status error:', error);
      return null;
    }
  }
}
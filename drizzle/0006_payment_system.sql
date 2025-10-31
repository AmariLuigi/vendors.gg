-- Payment System Migration
-- This migration adds comprehensive payment system tables for secure transactions

-- Payment Methods table - stores user payment methods
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"masked_details" jsonb,
	"billing_address" jsonb,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Orders table - main transaction records
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"conversation_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"platform_fee" numeric(10, 2) DEFAULT '0.00',
	"processing_fee" numeric(10, 2) DEFAULT '0.00',
	"seller_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"delivery_status" text DEFAULT 'pending',
	"expires_at" timestamp,
	"paid_at" timestamp,
	"delivered_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"delivery_instructions" text,
	"delivery_proof" jsonb,
	"buyer_notes" text,
	"seller_notes" text,
	"dispute_reason" text,
	"dispute_details" text,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);

-- Payment Transactions table - detailed payment records
CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_method_id" uuid,
	"transaction_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"provider" text NOT NULL,
	"provider_transaction_id" text,
	"provider_response" jsonb,
	"status" text NOT NULL,
	"failure_reason" text,
	"risk_score" numeric(5, 2),
	"fraud_flags" jsonb,
	"ip_address" text,
	"user_agent" text,
	"processed_at" timestamp,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_transactions_transaction_id_unique" UNIQUE("transaction_id")
);

-- Escrow table - holds funds during transaction
CREATE TABLE IF NOT EXISTS "escrow_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" text DEFAULT 'held',
	"auto_release_at" timestamp,
	"release_condition" text,
	"released_at" timestamp,
	"released_by" uuid,
	"release_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Payment Notifications table - track payment-related notifications
CREATE TABLE IF NOT EXISTS "payment_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"transaction_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"channels" jsonb,
	"status" text DEFAULT 'pending',
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Refunds table - track refund requests and processing
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"original_transaction_id" uuid NOT NULL,
	"refund_transaction_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"reason" text NOT NULL,
	"requested_by" uuid NOT NULL,
	"request_reason" text,
	"request_notes" text,
	"status" text DEFAULT 'pending',
	"processed_by" uuid,
	"processing_notes" text,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_accounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_accounts_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_accounts_id_fk" FOREIGN KEY ("seller_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_released_by_accounts_id_fk" FOREIGN KEY ("released_by") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_notifications" ADD CONSTRAINT "payment_notifications_user_id_accounts_id_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_notifications" ADD CONSTRAINT "payment_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_notifications" ADD CONSTRAINT "payment_notifications_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_original_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("original_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refund_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("refund_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_accounts_id_fk" FOREIGN KEY ("requested_by") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_accounts_id_fk" FOREIGN KEY ("processed_by") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update conversations table to reference orders
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_payment_methods_user_id" ON "payment_methods" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_payment_methods_type" ON "payment_methods" ("type");
CREATE INDEX IF NOT EXISTS "idx_orders_buyer_id" ON "orders" ("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_seller_id" ON "orders" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_orders_listing_id" ON "orders" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders" ("payment_status");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order_id" ON "payment_transactions" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_status" ON "payment_transactions" ("status");
CREATE INDEX IF NOT EXISTS "idx_escrow_holds_order_id" ON "escrow_holds" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_escrow_holds_status" ON "escrow_holds" ("status");
CREATE INDEX IF NOT EXISTS "idx_payment_notifications_user_id" ON "payment_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_order_id" ON "refunds" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_status" ON "refunds" ("status");
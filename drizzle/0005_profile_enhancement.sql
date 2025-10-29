-- Add comprehensive profile fields to accounts table
ALTER TABLE "accounts" ADD COLUMN "phone" text;
ALTER TABLE "accounts" ADD COLUMN "country" text;
ALTER TABLE "accounts" ADD COLUMN "timezone" text;
ALTER TABLE "accounts" ADD COLUMN "language" text DEFAULT 'en';
ALTER TABLE "accounts" ADD COLUMN "date_of_birth" date;
ALTER TABLE "accounts" ADD COLUMN "gender" text;

-- Seller-specific fields
ALTER TABLE "accounts" ADD COLUMN "business_name" text;
ALTER TABLE "accounts" ADD COLUMN "business_type" text; -- 'individual', 'business', 'company'
ALTER TABLE "accounts" ADD COLUMN "tax_id" text;
ALTER TABLE "accounts" ADD COLUMN "business_address" jsonb;
ALTER TABLE "accounts" ADD COLUMN "business_phone" text;
ALTER TABLE "accounts" ADD COLUMN "business_email" text;
ALTER TABLE "accounts" ADD COLUMN "website" text;
ALTER TABLE "accounts" ADD COLUMN "social_links" jsonb; -- {twitter, discord, twitch, etc}

-- Trading preferences and settings
ALTER TABLE "accounts" ADD COLUMN "preferred_games" jsonb; -- array of game IDs
ALTER TABLE "accounts" ADD COLUMN "trading_regions" jsonb; -- array of supported regions
ALTER TABLE "accounts" ADD COLUMN "payment_methods" jsonb; -- array of accepted payment methods
ALTER TABLE "accounts" ADD COLUMN "delivery_methods" jsonb; -- array of delivery methods offered
ALTER TABLE "accounts" ADD COLUMN "response_time" text; -- 'within_1_hour', 'within_24_hours', etc
ALTER TABLE "accounts" ADD COLUMN "trading_hours" jsonb; -- {start: '09:00', end: '18:00', timezone: 'UTC'}

-- Verification and trust
ALTER TABLE "accounts" ADD COLUMN "verification_level" text DEFAULT 'basic'; -- 'basic', 'verified', 'premium'
ALTER TABLE "accounts" ADD COLUMN "verification_documents" jsonb; -- array of document URLs
ALTER TABLE "accounts" ADD COLUMN "kyc_status" text DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'
ALTER TABLE "accounts" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;

-- Statistics and performance
ALTER TABLE "accounts" ADD COLUMN "total_sales" integer DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN "total_purchases" integer DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN "total_earnings" numeric(12, 2) DEFAULT '0.00';
ALTER TABLE "accounts" ADD COLUMN "total_spent" numeric(12, 2) DEFAULT '0.00';
ALTER TABLE "accounts" ADD COLUMN "completion_rate" numeric(5, 2) DEFAULT '0.00'; -- percentage
ALTER TABLE "accounts" ADD COLUMN "average_delivery_time" integer; -- in hours
ALTER TABLE "accounts" ADD COLUMN "dispute_count" integer DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN "positive_feedback_count" integer DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN "negative_feedback_count" integer DEFAULT 0;

-- Account status and settings
ALTER TABLE "accounts" ADD COLUMN "account_status" text DEFAULT 'active'; -- 'active', 'suspended', 'banned', 'inactive'
ALTER TABLE "accounts" ADD COLUMN "last_active" timestamp;
ALTER TABLE "accounts" ADD COLUMN "notification_preferences" jsonb; -- email, sms, push notifications settings
ALTER TABLE "accounts" ADD COLUMN "privacy_settings" jsonb; -- profile visibility, contact preferences
ALTER TABLE "accounts" ADD COLUMN "marketing_consent" boolean DEFAULT false;

-- Profile completion and onboarding
ALTER TABLE "accounts" ADD COLUMN "profile_completion" integer DEFAULT 0; -- percentage 0-100
ALTER TABLE "accounts" ADD COLUMN "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "accounts" ADD COLUMN "terms_accepted_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN "privacy_policy_accepted_at" timestamp;
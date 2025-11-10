This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Stripe Payments

Stripe integration powers card payments on checkout with optional 3D Secure (SCA) support.

- Required env vars:
  - `STRIPE_SECRET_KEY` (server-only)
  - `STRIPE_WEBHOOK_SECRET` (server-only)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)

- Setup steps:
  - Create a Stripe account and a Standard API key in the Stripe Dashboard.
  - Add the keys to your environment and restart the dev server.
  - In Dashboard → Developers → Webhooks, add an endpoint pointing to `https://<your-host>/api/payments/webhooks` and select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.processing`. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
  - In the buyer dashboard, add a Credit Card payment method. This creates a Stripe PaymentMethod server-side and securely stores only masked details in your account.
  - On checkout, payments that require authentication will prompt 3D Secure via Stripe.

- Notes:
  - Dev defaults use the mock provider; set `PAYMENT_PROVIDER=stripe` to force Stripe in non-prod.
  - Webhooks update order and transaction status after Stripe events; keep your webhook endpoint active in all environments.
  - Card details are sent to Stripe on the server to create a PaymentMethod; only masked data and the Stripe ID are stored.

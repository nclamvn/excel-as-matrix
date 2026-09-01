// ═══════════════════════════════════════════════════════════════════════════
// BILLING ROUTES — Stripe checkout + subscription management
// ═══════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { serverConfig } from '../config/env.js';
import { toProxyErrorStatus } from '../http/upstreamStatus.js';

const STRIPE_SECRET_KEY = serverConfig.stripeSecretKey;
const STRIPE_API = 'https://api.stripe.com/v1';

export const billingRouter = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/billing/checkout — Create Stripe Checkout Session
// ─────────────────────────────────────────────────────────────────────────────

billingRouter.post('/checkout', async (c) => {
  if (!STRIPE_SECRET_KEY) {
    return c.json({ error: 'Billing service is not configured on this server' }, 503);
  }

  const { priceId, planId, billingCycle, successUrl, cancelUrl } = await c.req.json();

  if (!priceId || !successUrl || !cancelUrl) {
    return c.json({ error: 'priceId, successUrl, cancelUrl required' }, 400);
  }

  try {
    const params = new URLSearchParams({
      'mode': 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'metadata[planId]': planId || '',
      'metadata[billingCycle]': billingCycle || '',
    });

    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Stripe error:', error);
      return c.json(
        { error: error.error?.message || 'Stripe error' },
        toProxyErrorStatus(response.status)
      );
    }

    const session = await response.json();
    return c.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Billing checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/billing/portal — Create Stripe Customer Portal Session
// ─────────────────────────────────────────────────────────────────────────────

billingRouter.post('/portal', async (c) => {
  if (!STRIPE_SECRET_KEY) {
    return c.json({ error: 'Billing service is not configured on this server' }, 503);
  }

  const { customerId, returnUrl } = await c.req.json();
  if (!customerId || !returnUrl) {
    return c.json({ error: 'customerId, returnUrl required' }, 400);
  }

  try {
    const params = new URLSearchParams({
      'customer': customerId,
      'return_url': returnUrl,
    });

    const response = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      return c.json(
        { error: error.error?.message || 'Stripe error' },
        toProxyErrorStatus(response.status)
      );
    }

    const session = await response.json();
    return c.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/billing/webhook — Stripe Webhook handler
// ─────────────────────────────────────────────────────────────────────────────

billingRouter.post('/webhook', async (c) => {
  if (!STRIPE_SECRET_KEY || !serverConfig.stripeWebhookSecret) {
    return c.json({ error: 'Stripe webhook service is not configured on this server' }, 503);
  }

  const body = await c.req.text();
  // In production: verify stripe-signature header with webhook secret
  // const sig = c.req.header('stripe-signature');

  try {
    const event = JSON.parse(body);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`[Billing] Checkout completed: ${session.id}, plan: ${session.metadata?.planId}`);
        // TODO: Update user subscription in database
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log(`[Billing] Subscription updated: ${sub.id}, status: ${sub.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`[Billing] Subscription canceled: ${sub.id}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`[Billing] Payment failed: ${invoice.id}`);
        break;
      }
      default:
        console.log(`[Billing] Unhandled event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/billing/status — Get subscription status
// ─────────────────────────────────────────────────────────────────────────────

billingRouter.get('/status', (c) => {
  // In production: look up user's subscription from database
  return c.json({
    configured: !!STRIPE_SECRET_KEY,
    planId: 'free',
    status: 'none',
  });
});

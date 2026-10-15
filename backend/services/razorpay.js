import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../logger.js';

// Initialize Razorpay instance (use test keys in dev, live keys in production)
let razorpay = null;

function getRazorpayClient() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID     || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
      // Use test mode by default (RAZORPAY_TEST_MODE=true)
      ...(process.env.RAZORPAY_TEST_MODE !== 'false' ? { testMode: true } : {}),
    });
  }
  return razorpay;
}

/**
 * Create a Razorpay payout / payment link for a withdrawal
 * Returns: { orderId, amountInPaise, shortUrl }
 */
export async function createWithdrawalIntent(userId, amount, upiId) {
  const amountInPaise = Math.round(amount * 100); // Razorpay uses paise
  let orderId = `order_sim_${Date.now()}`;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const client = getRazorpayClient();
      const order = await client.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `wd-${userId}-${Date.now()}`,
        notes: { userId, upiId, purpose: 'carrier_withdrawal' },
      });
      orderId = order.id;
    } catch (err) {
      logger.warn('Razorpay order creation fallback to simulated order', { error: err.message });
    }
  }

  const upiPayload = new URLSearchParams({
    pa: `CC${orderId}`,
    pn: 'CampusCarry Withdrawal',
    am: String(amountInPaise / 100),
    cu: 'INR',
    mc: 'CampusCarry',
    tr: orderId,
    url: 'https://campuscarry.com/withdraw',
  }).toString();

  const upiPaymentUrl = `upi://pay?${upiPayload}`;
  logger.info('Withdrawal intent created', { userId, orderId, amountInPaise, upiPaymentUrl });

  return { orderId, amountInPaise, shortUrl: upiPaymentUrl };
}

/**
 * Verify the signature of a Razorpay webhook payload
 */
export async function verifyWebhookSignature(payload, signature) {
  const client = getRazorpayClient();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  if (!secret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification');
    return true; // Allow in dev if no secret configured
  }

  try {
    return client.utility.verifyWebhookSignature(payload, signature, secret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { err });
    return false;
  }
}

/**
 * Fetch Razorpay account balance (for admin dashboards)
 */
export async function getRazorpayBalance() {
  const client = getRazorpayClient();
  try {
    const accounts = await client.accounts.list();
    return accounts;
  } catch (err) {
    logger.error('Failed to fetch Razorpay balance', { err });
    return null;
  }
}

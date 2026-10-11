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
  const client = getRazorpayClient();
  const amountInPaise = Math.round(amount * 100); // Razorpay uses paise

  // Create an order for the payout
  const order = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt:  `wd-${userId}-${Date.now()}`,
    notes: {
      userId,
      upiId,
      purpose: 'carrier_withdrawal',
    },
  });

  // Generate a UPI payment link (short URL) for the carrier to complete payment
  // In production, you'd use Razorpay Payment Links API or a UPI intent flow
  const upiPayload = new URLSearchParams({
    pa:  `CC${order.id}`,           // provider address (your UPI ID)
    pn:  'CampusCarry Withdrawal',
    am:  String(amountInPaise),
    cu:  'INR',
    mc:  'CampusCarry',
    tr:  order.id,
    url: 'https://campuscarry.com/withdraw',
  }).toString();

  const upiPaymentUrl = `upi://pay?${upiPayload}`;

  logger.info('Withdrawal order created', { userId, orderId: order.id, amountInPaise, upiPaymentUrl });

  return { orderId: order.id, amountInPaise, shortUrl: upiPaymentUrl };
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

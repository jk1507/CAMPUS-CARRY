import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { withdrawalSchema } from '../validators/index.js';
import { createWithdrawalIntent, verifyWebhookSignature } from '../services/razorpay.js';
import logger from '../logger.js';

const router = express.Router();

// POST /api/withdrawals — create a Razorpay payout intent + DB record
router.post('/', authenticate, validate(withdrawalSchema), async (req, res) => {
  try {
    const { amount, upi_id } = req.body;
    const user_id = req.user.id;

    // Cannot withdraw if there's already a pending withdrawal
    const [pending] = await pool.query(
      'SELECT id FROM withdrawals WHERE user_id = ? AND status = ?',
      [user_id, 'pending']
    );
    if (pending.length > 0) {
      return res.status(409).json({ success: false, error: 'You already have a pending withdrawal request' });
    }

    // Create Razorpay order / payout intent
    const { orderId, amountInPaise, shortUrl } = await createWithdrawalIntent(user_id, amount, upi_id);

    const [result] = await pool.query(
      'INSERT INTO withdrawals (user_id, amount, upi_id, status) VALUES (?, ?, ?, ?)',
      [user_id, amount, upi_id, 'pending']
    );

    logger.info('Withdrawal initiated', { userId: user_id, withdrawalId: result.insertId, amount, upi_id });

    return res.json({
      success: true,
      data: {
        withdrawalId: result.insertId,
        orderId,
        amount: amountInPaise, // paise amount for Razorpay
        upiPaymentUrl: shortUrl,
        message: 'Payment link created. Complete the UPI payment to finalize your withdrawal.',
      },
    });
  } catch (err) {
    logger.error('Withdrawal error', { err });
    return res.status(500).json({ success: false, error: 'Failed to create withdrawal' });
  }
});

// GET /api/withdrawals — fetch user's withdrawal history
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, amount, upi_id, status, created_at, updated_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
  }
});

// POST /api/webhooks/razorpay — handle Razorpay payment confirmation
router.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();

    if (!signature || !(await verifyWebhookSignature(body, signature))) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(body);
    const { payout_id, amount, status, error_description } = payload.payload?.payout || {};

    if (!payout_id) return res.status(200).json({ received: true });

    // Update withdrawal status based on payout status
    let withdrawalStatus = 'failed';
    if (status === 'processed') withdrawalStatus = 'processed';
    else if (status === 'pending') withdrawalStatus = 'pending';

    await pool.query(
      'UPDATE withdrawals SET status = ?, updated_at = NOW() WHERE user_id = ? AND amount = ?',
      [withdrawalStatus, payload.payload?.customer_id, amount]
    );

    // Create notification for the user
    await pool.query(
      'INSERT INTO notifications (user_id, title, body, type, ref_id) VALUES (?, ?, ?, ?, ?)',
      [
        payload.payload?.customer_id,
        withdrawalStatus === 'processed' ? '💰 Withdrawal Processed' : '⚠️ Withdrawal Failed',
        withdrawalStatus === 'processed'
          ? `₹${amount / 100} has been transferred to your UPI account.`
          : `Withdrawal failed: ${error_description || 'Unknown error'}. Try again.`,
        'withdrawal',
        payout_id,
      ]
    );

    logger.info('Razorpay webhook processed', { payout_id, status: withdrawalStatus });
    return res.json({ received: true });
  } catch (err) {
    logger.error('Webhook error', { err });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;

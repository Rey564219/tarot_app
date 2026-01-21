const { randomUUID } = require('crypto');
const db = require('../db');

async function verifyPurchase(req, res) {
  const { platform, receipt, product_key: productKey } = req.body || {};
  if (!platform || !receipt) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing platform or receipt' });
  }
  if (!productKey) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing product_key' });
  }

  // TODO: verify receipt with store and extract transaction id.
  const storeTransactionId = receipt;

  const product = await db.query(
    'SELECT id FROM products WHERE product_key = $1 AND platform = $2',
    [productKey, platform]
  );
  if (product.rows.length === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Product not found' });
  }

  await db.query(
    'INSERT INTO purchases (id, user_id, product_id, platform, store_transaction_id, status, verified_at) VALUES ($1, $2, $3, $4, $5, $6, now()) ON CONFLICT (platform, store_transaction_id) DO UPDATE SET status = EXCLUDED.status, verified_at = EXCLUDED.verified_at',
    [randomUUID(), req.userId, product.rows[0].id, platform, storeTransactionId, 'verified']
  );

  return res.json({ ok: true });
}

async function verifySubscription(req, res) {
  const { platform, receipt } = req.body || {};
  if (!platform || !receipt) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing platform or receipt' });
  }

  // TODO: verify receipt with store and extract subscription id and period.
  const storeSubscriptionId = receipt;
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.query(
    'INSERT INTO subscriptions (id, user_id, platform, store_subscription_id, status, current_period_start, current_period_end, auto_renew, verified_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now()) ON CONFLICT (platform, store_subscription_id) DO UPDATE SET status = EXCLUDED.status, current_period_start = EXCLUDED.current_period_start, current_period_end = EXCLUDED.current_period_end, auto_renew = EXCLUDED.auto_renew, verified_at = EXCLUDED.verified_at',
    [randomUUID(), req.userId, platform, storeSubscriptionId, 'active', now.toISOString(), end.toISOString(), true]
  );

  return res.json({ ok: true });
}

async function getStatus(req, res) {
  const sub = await db.query(
    'SELECT status, current_period_end FROM subscriptions WHERE user_id = $1 AND status = $2 AND current_period_end > now() ORDER BY current_period_end DESC LIMIT 1',
    [req.userId, 'active']
  );

  const subscriptionActive = sub.rows.length > 0;
  const subscriptionExpiresAt = subscriptionActive ? sub.rows[0].current_period_end : null;

  return res.json({
    subscription_active: subscriptionActive,
    subscription_expires_at: subscriptionExpiresAt,
    ads_disabled: subscriptionActive,
  });
}

module.exports = {
  verifyPurchase,
  verifySubscription,
  getStatus,
};

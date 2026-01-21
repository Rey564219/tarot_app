const { randomUUID } = require('crypto');
const db = require('../db');

function utcDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function executeReading(req, res) {
  const { fortune_type_key: fortuneTypeKey, input_json: inputJson } = req.body || {};
  if (!fortuneTypeKey) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing fortune_type_key' });
  }

  return db.withClient(async (client) => {
    await client.query('BEGIN');

    const ft = await client.query(
      'SELECT id, access_type_default, requires_warning FROM fortune_types WHERE key = $1',
      [fortuneTypeKey]
    );
    if (ft.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Fortune type not found' });
    }

    const fortuneTypeId = ft.rows[0].id;
    const accessType = ft.rows[0].access_type_default;

    if (ft.rows[0].requires_warning) {
      const warning = await client.query(
        "SELECT id FROM warnings_acceptance WHERE user_id = $1 AND fortune_type_id = $2 AND accepted_at > now() - interval '5 minutes' ORDER BY accepted_at DESC LIMIT 1",
        [req.userId, fortuneTypeId]
      );
      if (warning.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ code: 'WARNING_REQUIRED', message: 'Warning acceptance required' });
      }
    }

    if (accessType === 'life') {
      const life = await client.query(
        'SELECT current_life FROM user_lives WHERE user_id = $1 FOR UPDATE',
        [req.userId]
      );
      if (life.rows.length === 0 || life.rows[0].current_life <= 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ code: 'LIFE_EMPTY', message: 'Life is empty' });
      }
      await client.query(
        'UPDATE user_lives SET current_life = current_life - 1, updated_at = now() WHERE user_id = $1',
        [req.userId]
      );
      await client.query(
        'INSERT INTO life_events (id, user_id, event_type, amount, reason) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), req.userId, 'consume', -1, `execute:${fortuneTypeKey}`]
      );
    }

    if (accessType === 'subscription') {
      const sub = await client.query(
        'SELECT id FROM subscriptions WHERE user_id = $1 AND status = $2 AND current_period_end > now() LIMIT 1',
        [req.userId, 'active']
      );
      if (sub.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ code: 'SUBSCRIPTION_REQUIRED', message: 'Subscription required' });
      }
    }

    if (accessType === 'one_time') {
      const purchase = await client.query(
        'SELECT p.id FROM purchases p JOIN products pr ON p.product_id = pr.id WHERE p.user_id = $1 AND p.status = $2 AND pr.fortune_type_id = $3 LIMIT 1',
        [req.userId, 'verified', fortuneTypeId]
      );
      if (purchase.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ code: 'PURCHASE_REQUIRED', message: 'Purchase required' });
      }
    }

    const seed = `${req.userId}:${utcDateString()}:${fortuneTypeKey}`;
    const resultJson = {
      placeholder: true,
      fortune_type_key: fortuneTypeKey,
      seed,
    };

    const readingId = randomUUID();
    await client.query(
      'INSERT INTO readings (id, user_id, fortune_type_id, access_type, input_json, result_json, seed) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [readingId, req.userId, fortuneTypeId, accessType, inputJson || {}, resultJson, seed]
    );

    await client.query('COMMIT');
    return res.json({ reading_id: readingId, result_json: resultJson });
  });
}

async function listReadings(req, res) {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const result = await db.query(
    'SELECT id, fortune_type_id, access_type, input_json, result_json, seed, created_at FROM readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [req.userId, limit]
  );
  return res.json({ items: result.rows, next_cursor: null });
}

async function getReading(req, res) {
  const result = await db.query(
    'SELECT id, fortune_type_id, access_type, input_json, result_json, seed, created_at FROM readings WHERE user_id = $1 AND id = $2',
    [req.userId, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Reading not found' });
  }
  return res.json(result.rows[0]);
}

module.exports = {
  executeReading,
  listReadings,
  getReading,
};

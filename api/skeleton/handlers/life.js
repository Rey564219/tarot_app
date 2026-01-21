const { randomUUID } = require('crypto');
const db = require('../db');

async function getLife(req, res) {
  const result = await db.query(
    'SELECT current_life, max_life, updated_at FROM user_lives WHERE user_id = $1',
    [req.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Life not found' });
  }
  return res.json(result.rows[0]);
}

async function consumeLife(req, res) {
  const { fortune_type_key: fortuneTypeKey } = req.body || {};
  if (!fortuneTypeKey) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing fortune_type_key' });
  }

  return db.withClient(async (client) => {
    await client.query('BEGIN');
    const life = await client.query(
      'SELECT current_life, max_life FROM user_lives WHERE user_id = $1 FOR UPDATE',
      [req.userId]
    );
    if (life.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Life not found' });
    }
    if (life.rows[0].current_life <= 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ code: 'LIFE_EMPTY', message: 'Life is empty' });
    }

    const updated = await client.query(
      'UPDATE user_lives SET current_life = current_life - 1, updated_at = now() WHERE user_id = $1 RETURNING current_life, max_life, updated_at',
      [req.userId]
    );

    await client.query(
      'INSERT INTO life_events (id, user_id, event_type, amount, reason) VALUES ($1, $2, $3, $4, $5)',
      [randomUUID(), req.userId, 'consume', -1, `manual_consume:${fortuneTypeKey}`]
    );

    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  });
}

async function rewardAdComplete(req, res) {
  const { ad_provider: adProvider, placement, reward_amount: rewardAmount = 2 } = req.body || {};
  if (!adProvider || !placement) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing ad_provider or placement' });
  }

  return db.withClient(async (client) => {
    await client.query('BEGIN');
    const adEventId = randomUUID();
    await client.query(
      'INSERT INTO ad_events (id, user_id, ad_type, provider, placement, rewarded, reward_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [adEventId, req.userId, 'reward', adProvider, placement, true, rewardAmount]
    );

    const updated = await client.query(
      'UPDATE user_lives SET current_life = LEAST(current_life + $2, max_life), updated_at = now() WHERE user_id = $1 RETURNING current_life, max_life, updated_at',
      [req.userId, rewardAmount]
    );

    await client.query(
      'INSERT INTO life_events (id, user_id, event_type, amount, reason, related_ad_event_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), req.userId, 'recover', rewardAmount, 'reward_ad', adEventId]
    );

    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  });
}

module.exports = {
  getLife,
  consumeLife,
  rewardAdComplete,
};

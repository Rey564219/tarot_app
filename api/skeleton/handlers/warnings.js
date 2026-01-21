const { randomUUID } = require('crypto');
const db = require('../db');

async function acceptWarning(req, res) {
  const { fortune_type_key: fortuneTypeKey, ip, user_agent: userAgent } = req.body || {};
  if (!fortuneTypeKey) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing fortune_type_key' });
  }

  const ft = await db.query(
    'SELECT id FROM fortune_types WHERE key = $1',
    [fortuneTypeKey]
  );
  if (ft.rows.length === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Fortune type not found' });
  }

  await db.query(
    'INSERT INTO warnings_acceptance (id, user_id, fortune_type_id, ip, user_agent) VALUES ($1, $2, $3, $4, $5)',
    [randomUUID(), req.userId, ft.rows[0].id, ip || null, userAgent || null]
  );

  return res.json({ ok: true });
}

module.exports = {
  acceptWarning,
};

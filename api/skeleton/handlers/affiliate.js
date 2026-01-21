const { randomUUID } = require('crypto');
const db = require('../db');

async function trackClick(req, res) {
  const { affiliate_link_id: affiliateLinkId, placement } = req.body || {};
  if (!affiliateLinkId) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing affiliate_link_id' });
  }

  await db.query(
    'INSERT INTO affiliate_clicks (id, user_id, affiliate_link_id, placement) VALUES ($1, $2, $3, $4)',
    [randomUUID(), req.userId, affiliateLinkId, placement || null]
  );

  return res.json({ ok: true });
}

module.exports = {
  trackClick,
};

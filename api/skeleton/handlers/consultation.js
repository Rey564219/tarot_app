const { randomUUID } = require('crypto');
const db = require('../db');

async function requestConsultation(req, res) {
  const { contact_type: contactType, contact_value: contactValue, message } = req.body || {};
  if (!contactType || !contactValue) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing contact_type or contact_value' });
  }

  await db.query(
    'INSERT INTO consultation_requests (id, user_id, contact_type, contact_value, message) VALUES ($1, $2, $3, $4, $5)',
    [randomUUID(), req.userId, contactType, contactValue, message || null]
  );

  return res.json({ ok: true });
}

module.exports = {
  requestConsultation,
};

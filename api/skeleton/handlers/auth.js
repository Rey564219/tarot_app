const { randomUUID } = require('crypto');
const db = require('../db');

async function createAnonymous(req, res) {
  const userId = randomUUID();
  const authId = randomUUID();
  await db.query(
    'INSERT INTO users (id) VALUES ($1)',
    [userId]
  );
  await db.query(
    'INSERT INTO user_auth_providers (id, user_id, provider, provider_user_id) VALUES ($1, $2, $3, $4)',
    [authId, userId, 'anonymous', userId]
  );
  await db.query(
    'INSERT INTO user_lives (user_id, current_life, max_life) VALUES ($1, $2, $3)',
    [userId, 5, 5]
  );

  // TODO: issue real JWT for userId.
  return res.json({ token: 'TODO.JWT', user_id: userId });
}

async function oauthSignIn(req, res) {
  const { provider, id_token: idToken } = req.body || {};
  if (!provider || !idToken) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing provider or id_token' });
  }

  // TODO: verify idToken with Apple/Google.
  const providerUserId = idToken;

  const existing = await db.query(
    'SELECT user_id FROM user_auth_providers WHERE provider = $1 AND provider_user_id = $2',
    [provider, providerUserId]
  );

  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].user_id;
  } else {
    userId = randomUUID();
    await db.query('INSERT INTO users (id) VALUES ($1)', [userId]);
    await db.query(
      'INSERT INTO user_auth_providers (id, user_id, provider, provider_user_id) VALUES ($1, $2, $3, $4)',
      [randomUUID(), userId, provider, providerUserId]
    );
    await db.query(
      'INSERT INTO user_lives (user_id, current_life, max_life) VALUES ($1, $2, $3)',
      [userId, 5, 5]
    );
  }

  // TODO: issue real JWT for userId.
  return res.json({ token: 'TODO.JWT', user_id: userId });
}

module.exports = {
  createAnonymous,
  oauthSignIn,
};

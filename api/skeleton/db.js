const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  query(text, params) {
    return pool.query(text, params);
  },
  async withClient(fn) {
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  },
};

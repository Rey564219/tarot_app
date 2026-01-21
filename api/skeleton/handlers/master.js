const db = require('../db');

async function listFortuneTypes(req, res) {
  const result = await db.query(
    'SELECT id, key, name, access_type_default, requires_warning, description FROM fortune_types ORDER BY key'
  );
  return res.json(result.rows);
}

async function listProducts(req, res) {
  const result = await db.query(
    'SELECT id, product_key, fortune_type_id, name, price_cents, currency, platform, active FROM products WHERE active = true ORDER BY product_key'
  );
  return res.json(result.rows);
}

async function listAffiliateLinks(req, res) {
  const result = await db.query(
    'SELECT id, title, url, provider, active FROM affiliate_links WHERE active = true ORDER BY created_at'
  );
  return res.json(result.rows);
}

module.exports = {
  listFortuneTypes,
  listProducts,
  listAffiliateLinks,
};

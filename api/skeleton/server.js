const express = require('express');
const authHandlers = require('./handlers/auth');
const masterHandlers = require('./handlers/master');
const lifeHandlers = require('./handlers/life');
const readingHandlers = require('./handlers/readings');
const warningHandlers = require('./handlers/warnings');
const billingHandlers = require('./handlers/billing');
const affiliateHandlers = require('./handlers/affiliate');
const consultationHandlers = require('./handlers/consultation');

const app = express();
app.use(express.json());

// TODO: replace with real JWT auth middleware.
function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' });
  }
  req.userId = userId;
  return next();
}

app.post('/auth/anonymous', authHandlers.createAnonymous);
app.post('/auth/oauth', authHandlers.oauthSignIn);

app.get('/master/fortune-types', requireAuth, masterHandlers.listFortuneTypes);
app.get('/master/products', requireAuth, masterHandlers.listProducts);
app.get('/master/affiliate-links', requireAuth, masterHandlers.listAffiliateLinks);

app.get('/life', requireAuth, lifeHandlers.getLife);
app.post('/life/consume', requireAuth, lifeHandlers.consumeLife);
app.post('/ads/reward/complete', requireAuth, lifeHandlers.rewardAdComplete);

app.post('/readings/execute', requireAuth, readingHandlers.executeReading);
app.get('/readings', requireAuth, readingHandlers.listReadings);
app.get('/readings/:id', requireAuth, readingHandlers.getReading);

app.post('/warnings/accept', requireAuth, warningHandlers.acceptWarning);

app.post('/billing/verify/purchase', requireAuth, billingHandlers.verifyPurchase);
app.post('/billing/verify/subscription', requireAuth, billingHandlers.verifySubscription);
app.get('/billing/status', requireAuth, billingHandlers.getStatus);

app.post('/affiliate/click', requireAuth, affiliateHandlers.trackClick);

app.post('/consultation', requireAuth, consultationHandlers.requestConsultation);

module.exports = app;

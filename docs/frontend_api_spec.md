# Frontend API Connection Spec

## Common
- Auth bootstrap
  - If no token: `POST /auth/anonymous` → store JWT.
  - If OAuth: `POST /auth/oauth` → store JWT.
- Master preload (app start)
  - `GET /master/fortune-types`
  - `GET /master/products`
  - `GET /master/affiliate-links`
- Billing status preload (tab switch or app resume)
  - `GET /billing/status`
- Reading list preload (My Page)
  - `GET /readings?limit=20`

## Home
- Today free draw
  - `POST /readings/execute` with `fortune_type_key=today_free`
- Deep dive entry
  - If `billing.status.subscription_active=false`, show paywall.
  - On success: `POST /readings/execute` with `fortune_type_key=today_deep_love|work|money|trouble`
- Life display
  - `GET /life`
- Life recovery (rewarded ad)
  - Show rewarded ad (client SDK) → on completion
  - `POST /ads/reward/complete` with `placement=home_life_recover, reward_amount=2`

## Fortune List (占い一覧)
- No-description draw (life)
  - `POST /readings/execute` with `fortune_type_key=no_desc_draw`
  - If server returns life 부족, show ad recovery or subscription CTA.
- Buy-to-own items
  - Show products filtered by fortune_type_key from `GET /master/products`
  - Tapping item → Shop flow

## Compatibility (相性)
- Input form → `POST /readings/execute` with `fortune_type_key=compatibility` and `input_json`

## Shop
- Product list
  - `GET /master/products`
- Purchase
  - App store purchase → receipt
  - `POST /billing/verify/purchase`
- Execute purchased fortune
  - `POST /readings/execute` with matching `fortune_type_key`

## Warning (犯罪/不正/トライアングル)
- Before execute
  - `POST /warnings/accept` with `fortune_type_key=triangle_crime`
- Then execute
  - `POST /readings/execute` with `fortune_type_key=triangle_crime`

## My Page
- Subscription status
  - `GET /billing/status`
- Ad disable state
  - Derived from `billing.status.ads_disabled`
- Reading history
  - `GET /readings?limit=20`
  - Detail: `GET /readings/{id}`
- Purchase history
  - This version uses `GET /readings` (or add future `/billing/purchases`)
- Affiliate links
  - `GET /master/affiliate-links`
  - Click → `POST /affiliate/click`
- Consultation form
  - `POST /consultation`

## Error handling (front)
- 401: token refresh or re-auth
- 402/403: paywall (subscription or purchase needed)
- 409: warning required (force warning screen)
- 429: ad abuse throttling (disable ad button temporarily)

## Suggested client state cache
- `master.fortune_types`, `master.products`, `billing.status`, `life.status`
- Update `life.status` after `/readings/execute` (life) and `/ads/reward/complete`

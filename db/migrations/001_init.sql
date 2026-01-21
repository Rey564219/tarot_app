BEGIN;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  locale text,
  last_seen_at timestamptz
);

CREATE INDEX users_created_at_idx ON users (created_at);

CREATE TABLE user_auth_providers (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX user_auth_providers_user_id_idx ON user_auth_providers (user_id);

CREATE TABLE user_lives (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  current_life int NOT NULL,
  max_life int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_lives_updated_at_idx ON user_lives (updated_at);

CREATE TABLE ad_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  ad_type text NOT NULL,
  provider text,
  placement text,
  rewarded boolean NOT NULL DEFAULT false,
  reward_amount int,
  event_time timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ad_events_user_id_event_time_idx ON ad_events (user_id, event_time);
CREATE INDEX ad_events_type_rewarded_idx ON ad_events (ad_type, rewarded);

CREATE TABLE fortune_types (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  access_type_default text NOT NULL,
  requires_warning boolean NOT NULL DEFAULT false,
  description text
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  product_key text NOT NULL UNIQUE,
  fortune_type_id uuid NOT NULL REFERENCES fortune_types(id),
  name text NOT NULL,
  price_cents int NOT NULL,
  currency text NOT NULL,
  platform text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_fortune_type_id_idx ON products (fortune_type_id);
CREATE INDEX products_active_idx ON products (active);

CREATE TABLE purchases (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  platform text NOT NULL,
  store_transaction_id text NOT NULL,
  status text NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  UNIQUE (platform, store_transaction_id)
);

CREATE INDEX purchases_user_id_purchased_at_idx ON purchases (user_id, purchased_at);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  platform text NOT NULL,
  store_subscription_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  auto_renew boolean NOT NULL DEFAULT true,
  verified_at timestamptz,
  UNIQUE (platform, store_subscription_id)
);

CREATE INDEX subscriptions_user_id_status_idx ON subscriptions (user_id, status);

CREATE TABLE readings (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  fortune_type_id uuid NOT NULL REFERENCES fortune_types(id),
  access_type text NOT NULL,
  input_json jsonb,
  result_json jsonb NOT NULL,
  seed text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX readings_user_id_created_at_idx ON readings (user_id, created_at);
CREATE INDEX readings_fortune_type_id_created_at_idx ON readings (fortune_type_id, created_at);

CREATE TABLE life_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  event_type text NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL,
  related_reading_id uuid REFERENCES readings(id),
  related_ad_event_id uuid REFERENCES ad_events(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX life_events_user_id_created_at_idx ON life_events (user_id, created_at);
CREATE INDEX life_events_event_type_idx ON life_events (event_type);

CREATE TABLE warnings_acceptance (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  fortune_type_id uuid NOT NULL REFERENCES fortune_types(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);

CREATE INDEX warnings_acceptance_user_id_accepted_at_idx ON warnings_acceptance (user_id, accepted_at);
CREATE INDEX warnings_acceptance_fortune_type_id_accepted_at_idx ON warnings_acceptance (fortune_type_id, accepted_at);

CREATE TABLE affiliate_links (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  provider text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_links_active_idx ON affiliate_links (active);

CREATE TABLE affiliate_clicks (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  affiliate_link_id uuid NOT NULL REFERENCES affiliate_links(id),
  clicked_at timestamptz NOT NULL DEFAULT now(),
  placement text
);

CREATE INDEX affiliate_clicks_link_id_clicked_at_idx ON affiliate_clicks (affiliate_link_id, clicked_at);
CREATE INDEX affiliate_clicks_user_id_clicked_at_idx ON affiliate_clicks (user_id, clicked_at);

CREATE TABLE consultation_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  contact_type text NOT NULL,
  contact_value text NOT NULL,
  message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
);

CREATE INDEX consultation_requests_user_id_requested_at_idx ON consultation_requests (user_id, requested_at);

COMMIT;

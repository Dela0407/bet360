CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  balance_after_cents BIGINT NOT NULL CHECK (balance_after_cents >= 0),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wallet_transactions_user_id_idx ON wallet_transactions(user_id, created_at DESC);

CREATE TABLE bets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  league TEXT NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('1', 'X', '2')),
  odds DOUBLE PRECISION NOT NULL CHECK (odds >= 1.01 AND odds <= 1000),
  stake_cents BIGINT NOT NULL CHECK (stake_cents > 0),
  potential_return_cents BIGINT NOT NULL CHECK (potential_return_cents > 0),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bets_user_id_idx ON bets(user_id, placed_at DESC);

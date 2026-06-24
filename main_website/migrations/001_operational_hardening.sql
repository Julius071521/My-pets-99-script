-- Apply on staging first and back up the production database before execution.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  device_name VARCHAR(255) NULL,
  fingerprint CHAR(64) NOT NULL,
  ip_address VARCHAR(64) NULL,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_sessions_user_active (user_id, revoked_at, expires_at)
);

CREATE TABLE IF NOT EXISTS login_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  username_or_email VARCHAR(255) NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(64) NULL,
  device_name VARCHAR(255) NULL,
  risk_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_history_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS admin_security (
  user_id BIGINT PRIMARY KEY,
  totp_secret_encrypted TEXT NULL,
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  recovery_codes_hash TEXT NULL,
  last_reauthenticated_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_health_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  event_type ENUM('success','failure','circuit_open','circuit_close','rate_change') NOT NULL,
  latency_ms INT NULL,
  detail VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_provider_health_created (provider, created_at)
);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(100) NOT NULL,
  dedupe_key VARCHAR(128) NOT NULL,
  payload_json JSON NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error VARCHAR(1000) NULL,
  next_retry_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_failed_jobs_dedupe (job_type, dedupe_key),
  INDEX idx_failed_jobs_retry (resolved_at, next_retry_at)
);

CREATE TABLE IF NOT EXISTS financial_reconciliations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ledger_total DECIMAL(18,4) NOT NULL,
  balance_total DECIMAL(18,4) NOT NULL,
  provider_cost_total DECIMAL(18,4) NOT NULL,
  customer_charge_total DECIMAL(18,4) NOT NULL,
  variance DECIMAL(18,4) NOT NULL,
  status ENUM('balanced','variance','reviewed') NOT NULL,
  reviewed_by BIGINT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL;
ALTER TABLE orders ADD UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency (idempotency_key);

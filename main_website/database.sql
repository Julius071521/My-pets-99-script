-- ==========================================================================
-- SMM Boosting Website (ApexBoost) - MySQL Database Schema
-- Optimized for Namecheap Stellar Shared Hosting phpMyAdmin
-- ==========================================================================

-- Step 1: Set database charset
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL,
  `google_id` VARCHAR(255) NULL UNIQUE,
  `avatar` VARCHAR(255) NULL,
  `balance` DECIMAL(15, 4) DEFAULT 0.50,
  `role` VARCHAR(20) DEFAULT 'user',
  `email_verified` TINYINT(1) DEFAULT 0,
  `email_verification_token_hash` VARCHAR(255) NULL,
  `email_verification_expires_at` DATETIME NULL,
  `last_verification_sent_at` DATETIME NULL,
  `otp_code` VARCHAR(255) NULL,
  `otp_expiry` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `orders`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL UNIQUE,
  `provider_order_id` VARCHAR(50) NULL,
  `user_id` INT NOT NULL,
  `service_id` VARCHAR(50) NOT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `quantity` INT NOT NULL,
  `charge` DECIMAL(15, 4) NOT NULL,
  `start_count` VARCHAR(50) DEFAULT '0',
  `status` VARCHAR(50) DEFAULT 'Pending',
  `remains` VARCHAR(50) DEFAULT '0',
  `currency` VARCHAR(10) DEFAULT 'PHP',
  `api_cost` DECIMAL(15, 4) NULL,
  `selling_price` DECIMAL(15, 4) NULL,
  `markup_percent` DECIMAL(10, 2) NULL,
  `net_profit` DECIMAL(15, 4) NULL,
  `roi_percent` DECIMAL(10, 2) NULL,
  `profit_margin_percent` DECIMAL(10, 2) NULL,
  `api_provider` VARCHAR(100) DEFAULT 'RDKPanel',
  `order_status` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `tickets`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(255) NULL,
  `request_type` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `attachment` LONGTEXT NULL,
  `status` VARCHAR(20) DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `service_overrides`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_overrides` (
  `service_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `service_name` VARCHAR(255) NULL,
  `custom_rate` DECIMAL(10, 4) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `deposits`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(15, 4) NOT NULL,
  `reference_id` VARCHAR(100) NOT NULL UNIQUE,
  `status` VARCHAR(20) DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `user_notifications`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'system',
  `title` VARCHAR(160) NOT NULL,
  `message` TEXT NOT NULL,
  `metadata` TEXT NULL,
  `read_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_notifications_user_read` (`user_id`, `read_at`, `created_at`),
  INDEX `idx_user_notifications_created` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `password_reset_tokens`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `otp_codes`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `purpose` VARCHAR(50) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `attempts` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Table structure for `admin_audit_logs`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `affected_module` VARCHAR(100) NOT NULL,
  `affected_record_id` VARCHAR(100) NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `ip_address` VARCHAR(100) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_audit_module` (`affected_module`, `created_at`),
  INDEX `idx_admin_audit_admin` (`admin_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

CREATE DATABASE IF NOT EXISTS campuscarry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campuscarry;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)   NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  campus        VARCHAR(100)  NOT NULL,
  role          ENUM('requester','carrier') NOT NULL DEFAULT 'requester',
  phone         VARCHAR(15)   DEFAULT NULL,
  avatar_url    MEDIUMTEXT    DEFAULT NULL,
  bio           VARCHAR(300)  DEFAULT NULL,
  rating        DECIMAL(3,2)  DEFAULT NULL,
  fcm_token     VARCHAR(255)  DEFAULT NULL,
  is_banned     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_campus (campus)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS requests (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id     INT UNSIGNED NOT NULL,
  carrier_id       INT UNSIGNED DEFAULT NULL,
  campus           VARCHAR(100) NOT NULL,
  title            VARCHAR(150) NOT NULL,
  description      VARCHAR(500) DEFAULT NULL,
  pickup_location  VARCHAR(200) NOT NULL,
  dropoff_location VARCHAR(200) NOT NULL,
  reward           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  weight_kg        DECIMAL(5,2)  DEFAULT NULL,
  status           ENUM('open','accepted','in_progress','delivered','cancelled') NOT NULL DEFAULT 'open',
  deadline         DATETIME      DEFAULT NULL,
  paid_out         TINYINT(1)    NOT NULL DEFAULT 0,
  otp              VARCHAR(10)   DEFAULT NULL,
  proof_photo      MEDIUMTEXT    DEFAULT NULL,
  carrier_address  VARCHAR(255)  DEFAULT NULL,
  carrier_lat      DECIMAL(10,7) DEFAULT NULL,
  carrier_lng      DECIMAL(10,7) DEFAULT NULL,
  carrier_updated_at DATETIME    DEFAULT NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (carrier_id)   REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_requests_campus    (campus),
  INDEX idx_requests_status    (status),
  INDEX idx_requests_requester (requester_id),
  INDEX idx_requests_carrier   (carrier_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL UNIQUE,
  request_id INT UNSIGNED DEFAULT NULL,
  lat        DECIMAL(10,7) NOT NULL,
  lng        DECIMAL(10,7) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id   INT UNSIGNED NOT NULL,
  from_user_id INT UNSIGNED NOT NULL,
  message      TEXT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id)   REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_chat_request (request_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedback (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id   INT UNSIGNED NOT NULL,
  from_user_id INT UNSIGNED NOT NULL,
  to_user_id   INT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  comment      VARCHAR(500) DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id)   REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (to_user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  UNIQUE KEY uq_feedback (request_id, from_user_id),
  INDEX idx_feedback_to (to_user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(150) NOT NULL,
  body       VARCHAR(500) DEFAULT NULL,
  type       VARCHAR(50)  DEFAULT 'general',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  ref_id     INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id      INT UNSIGNED NOT NULL,
  reported_user_id INT UNSIGNED NOT NULL,
  request_id       INT UNSIGNED DEFAULT NULL,
  reason           VARCHAR(500) NOT NULL,
  status           ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)      REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (request_id)       REFERENCES requests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawals (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  upi_id     VARCHAR(100)  NOT NULL,
  status     ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

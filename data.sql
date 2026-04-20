-- ============================================================
-- Gerenciador Financeiro - Schema do banco de dados
-- Execute este arquivo no MySQL antes de iniciar o servidor
-- ============================================================

CREATE DATABASE IF NOT EXISTS financial_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE financial_manager;

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email),
  INDEX idx_email (email)
);

-- Tabela de transacoes
CREATE TABLE IF NOT EXISTS transactions (
  id          INT                      NOT NULL AUTO_INCREMENT,
  user_id     INT                      NOT NULL,
  type        ENUM('income','expense') NOT NULL,
  amount      DECIMAL(15,2)            NOT NULL,
  description VARCHAR(500),
  date        DATE                     NOT NULL,
  created_at  TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_date (user_id, date),
  CONSTRAINT chk_transactions_amount CHECK (amount > 0),
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS bills_todo (
  id          INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  due_date    DATE          NOT NULL,
  is_paid     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bills_user_due (user_id, is_paid, due_date),
  CONSTRAINT chk_bills_amount CHECK (amount > 0),
  CONSTRAINT fk_bills_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

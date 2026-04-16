-- ============================================================
-- Gerenciador Financeiro — Schema do banco de dados
-- Execute este arquivo no MySQL antes de iniciar o servidor
-- ============================================================

CREATE DATABASE IF NOT EXISTS financial_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE financial_manager;

-- ─── Tabela de usuários ───────────────────────────────────────
-- password armazena hash bcrypt, nunca texto puro
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

-- ─── Tabela de transações ─────────────────────────────────────
-- idx_user_date otimiza listagem por usuário/data
-- fk com CASCADE remove transações se o usuário for deletado
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

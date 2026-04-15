// config/db.js
// ─────────────────────────────────────────────────────────────
// Cria um pool de conexões MySQL reutilizáveis.
// Pool é mais eficiente que abrir/fechar uma conexão por request:
// ele mantém conexões abertas e as empresta para cada query.
// ─────────────────────────────────────────────────────────────

const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'financial_manager',
  waitForConnections: true,   // aguarda conexão disponível ao invés de lançar erro
  connectionLimit:    10,     // máximo de conexões simultâneas no pool
  queueLimit:         0,      // 0 = fila ilimitada de requests aguardando conexão
  charset:            'utf8mb4',
})

// Testa a conexão ao inicializar — falha rápido se o banco estiver inacessível
;(async () => {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL conectado com sucesso')
    conn.release()
  } catch (err) {
    console.error('❌ Falha ao conectar no MySQL:', err)
    process.exit(1) // encerra o processo — sem banco, o servidor não faz sentido
  }
})()

module.exports = pool
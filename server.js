// server.js
// ─────────────────────────────────────────────────────────────
// Ponto de entrada do servidor Express.
// Configura middlewares globais, registra as rotas e inicia.
// ─────────────────────────────────────────────────────────────

require('dotenv').config()              // carrega variáveis do .env antes de tudo

const express = require('express')
const cors    = require('cors')
const path    = require('path')

const authRoutes         = require('./routes/auth')
const transactionsRoutes = require('./routes/transactions')

const app  = express()
const PORT = process.env.PORT || 3000

// ─── Middlewares globais ──────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false }))

// ─── Frontend estático ────────────────────────────────────────
// Serve index.html e demais arquivos da pasta frontend/
app.use(express.static(path.join(__dirname, 'frontend')))

// ─── Rotas da API ─────────────────────────────────────────────
app.use('/api', authRoutes)                       // POST /api/register, /api/login
app.use('/api/transactions', transactionsRoutes)  // CRUD /api/transactions

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Rota não encontrada ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

// ─── Erros globais ────────────────────────────────────────────
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error('[Erro global]', err)
  res.status(500).json({ error: 'Erro interno do servidor.' })
})

// ─── Inicialização ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
})
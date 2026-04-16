// server.js
// ─────────────────────────────────────────────────────────────
// Ponto de entrada do servidor Express.
// Configura middlewares globais, registra as rotas e inicia.
// ─────────────────────────────────────────────────────────────

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const transactionsRoutes = require('./routes/transactions')

const app = express()
const PORT = Number(process.env.PORT || 3000)
const ownOrigin = process.env.APP_ORIGIN || `http://localhost:${PORT}`
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || ownOrigin)
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
)

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado.')
}

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL deve ser definido em produção.')
}

// ─── Middlewares globais ──────────────────────────────────────

app.disable('x-powered-by')

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  )
  next()
})

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origem não permitida por CORS.'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
  if (err.message === 'Origem não permitida por CORS.') {
    return res.status(403).json({ error: err.message })
  }

  return res.status(500).json({ error: 'Erro interno do servidor.' })
})

// ─── Inicialização ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor rodando em ${ownOrigin}`)
})

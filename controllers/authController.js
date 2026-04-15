// controllers/authController.js
// ─────────────────────────────────────────────────────────────
// Lógica de registro e login de usuários.
// bcryptjs: faz o hash da senha antes de salvar.
// jwt: gera o token de acesso após login bem-sucedido.
// ─────────────────────────────────────────────────────────────

const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')
const { validationResult } = require('express-validator')

// ─── POST /register ───────────────────────────────────────────
// Cria um novo usuário. A senha nunca é armazenada em texto puro.
async function register(req, res) {
  // Se houver erros de validação (definidos na rota), retorna imediatamente
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const { name, email, password } = req.body

  try {
    // Verifica se o e-mail já está em uso (a constraint UNIQUE do banco também
    // protege, mas verificar aqui dá uma mensagem de erro mais amigável)
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    if (rows.length > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' })
    }

    // Gera o hash da senha com custo 12 (bom equilíbrio segurança × velocidade)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insere o usuário — prepared statement previne SQL injection
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    )

    // Gera token já no registro para o usuário entrar direto
    const token = generateToken({ id: result.insertId, name: name.trim(), email })

    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      token,
      user: { id: result.insertId, name: name.trim(), email }
    })
  } catch (err) {
    console.error('[register]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// ─── POST /login ──────────────────────────────────────────────
// Autentica o usuário e devolve um JWT.
async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    // Busca o usuário pelo e-mail (normalizado para minúsculas)
    const [rows] = await pool.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    )

    if (rows.length === 0) {
      // Mensagem genérica: não revelamos se o e-mail existe ou não
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    const user = rows[0]

    // Compara a senha fornecida com o hash armazenado
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    const token = generateToken({ id: user.id, name: user.name, email: user.email })

    return res.json({
      message: 'Login realizado com sucesso.',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// ─── Helper: gera JWT ─────────────────────────────────────────
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

module.exports = { register, login }
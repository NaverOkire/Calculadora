const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

const pool = require('../config/db')

const AUTH_COOKIE_NAME = 'fm_session'

function normalizeEmail(email) {
  return email.toLowerCase().trim()
}

function buildCookieHeader(token, maxAge) {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
    'Path=/',
  ]

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', buildCookieHeader(token, 7 * 24 * 60 * 60))
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', buildCookieHeader('', 0))
}

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

async function register(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const { name, email, password } = req.body
  const normalizedName = name.trim()
  const normalizedEmail = normalizeEmail(email)

  try {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    )
    if (rows.length > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [normalizedName, normalizedEmail, hashedPassword]
    )

    const user = { id: result.insertId, name: normalizedName, email: normalizedEmail }
    const token = generateToken(user)
    setSessionCookie(res, token)

    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      user,
    })
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'E-mail já cadastrado.' })
    }

    console.error('[register]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const normalizedEmail = normalizeEmail(email)

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [normalizedEmail]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    const user = rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email }
    const token = generateToken(sessionUser)
    setSessionCookie(res, token)

    return res.json({
      message: 'Login realizado com sucesso.',
      user: sessionUser,
    })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

function me(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    }
  })
}

function logout(req, res) {
  clearSessionCookie(res)
  return res.json({ message: 'Logout realizado com sucesso.' })
}

module.exports = { register, login, me, logout }

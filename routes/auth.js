// routes/auth.js
// ─────────────────────────────────────────────────────────────
// Define as rotas públicas de autenticação.
// express-validator valida e sanitiza os dados ANTES de
// chegar no controller — o controller não precisa se preocupar.
// ─────────────────────────────────────────────────────────────

const express = require('express')
const { body }  = require('express-validator')
const { register, login } = require('../controllers/authController')

const router = express.Router()

// ─── Regras de validação reutilizáveis ────────────────────────

const registroRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.'),

  body('email')
    .trim()
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),             // converte para minúsculas, remove aliases

  body('password')
    .isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
]

const loginRules = [
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
]

// ─── Rotas ────────────────────────────────────────────────────

router.post('/register', registroRules, register)
router.post('/login',    loginRules,    login)

module.exports = router;
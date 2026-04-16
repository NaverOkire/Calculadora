const express = require('express')
const { body } = require('express-validator')

const { register, login, me, logout } = require('../controllers/authController')
const auth = require('../middleware/auth')
const asyncHandler = require('../middleware/asyncHandler')
const createRateLimiter = require('../middleware/rateLimit')

const router = express.Router()
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas. Tente novamente em alguns minutos.',
})

const registroRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.'),

  body('email')
    .trim()
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 10 }).withMessage('Senha deve ter ao menos 10 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('Senha deve conter letra minúscula, maiúscula e número.'),
]

const loginRules = [
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
]

router.post('/register', authLimiter, registroRules, asyncHandler(register))
router.post('/login', authLimiter, loginRules, asyncHandler(login))
router.get('/me', auth, me)
router.post('/logout', logout)

module.exports = router

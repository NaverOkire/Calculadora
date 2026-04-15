// routes/transactions.js
// ─────────────────────────────────────────────────────────────
// Rotas PROTEGIDAS de transações.
// O middleware auth garante que apenas usuários autenticados
// acessem essas rotas.
// ─────────────────────────────────────────────────────────────

const express = require('express')
const { body }  = require('express-validator')
const auth      = require('../middleware/auth')
const { list, create, update, remove } = require('../controllers/transactionsController')

const router = express.Router()

// Aplica autenticação em todas as rotas deste arquivo de uma vez
router.use(auth)

// ─── Regras de validação compartilhadas ───────────────────────

const transactionRules = [
  body('type')
    .isIn(['income', 'expense']).withMessage('Tipo deve ser "income" ou "expense".'),

  body('amount')
    .isFloat({ gt: 0 }).withMessage('Valor deve ser um número positivo.'),

  body('date')
    .isDate().withMessage('Data inválida (use o formato YYYY-MM-DD).'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres.'),
]

// ─── Rotas ────────────────────────────────────────────────────

router.get('/',     list)
router.post('/',    transactionRules, create)
router.put('/:id',  transactionRules, update)
router.delete('/:id', remove)

module.exports = router
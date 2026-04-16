const express = require('express')
const { body, param, query } = require('express-validator')

const auth = require('../middleware/auth')
const asyncHandler = require('../middleware/asyncHandler')
const { list, create, update, remove } = require('../controllers/transactionsController')

const router = express.Router()

router.use(auth)

const transactionRules = [
  body('type')
    .isIn(['income', 'expense']).withMessage('Tipo deve ser "income" ou "expense".'),

  body('amount')
    .isFloat({ gt: 0 }).withMessage('Valor deve ser um número positivo.'),

  body('date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Data inválida (use o formato YYYY-MM-DD).'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres.'),
]

const transactionIdRules = [
  param('id').isInt({ gt: 0 }).withMessage('ID inválido.')
]

const transactionQueryRules = [
  query('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Tipo inválido.'),
  query('from')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Filtro "from" inválido.'),
  query('to')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Filtro "to" inválido.'),
]

router.get('/', transactionQueryRules, asyncHandler(list))
router.post('/', transactionRules, asyncHandler(create))
router.put('/:id', transactionIdRules, transactionRules, asyncHandler(update))
router.delete('/:id', transactionIdRules, asyncHandler(remove))

module.exports = router

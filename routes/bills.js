const express = require('express')
const { body, param } = require('express-validator')

const auth = require('../middleware/auth')
const asyncHandler = require('../middleware/asyncHandler')
const { list, create, update, remove } = require('../controllers/billsController')

const router = express.Router()

router.use(auth)

const billRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome da conta é obrigatório.')
    .isLength({ max: 100 }).withMessage('Nome da conta deve ter no máximo 100 caracteres.'),

  body('amount')
    .isFloat({ gt: 0 }).withMessage('Valor deve ser um número positivo.')
    .toFloat(),

  body('due_date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Data inválida (use o formato YYYY-MM-DD).'),
]

const billIdRules = [
  param('id').isInt({ gt: 0 }).withMessage('ID inválido.'),
]

const billStatusRules = [
  body('is_paid')
    .isInt({ min: 0, max: 1 }).withMessage('Status inválido.')
    .toInt(),
]

router.get('/', asyncHandler(list))
router.post('/', billRules, asyncHandler(create))
router.patch('/:id', billIdRules, billStatusRules, asyncHandler(update))
router.delete('/:id', billIdRules, asyncHandler(remove))

module.exports = router

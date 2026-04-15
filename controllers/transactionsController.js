// controllers/transactionsController.js
// ─────────────────────────────────────────────────────────────
// CRUD completo de transações.
// IMPORTANTE: todas as queries filtram por user_id = req.user.id,
// garantindo que um usuário nunca acesse dados de outro.
// ─────────────────────────────────────────────────────────────

const pool = require('../config/db')
const { validationResult } = require('express-validator')

// ─── GET /transactions ────────────────────────────────────────
// Lista as transações do usuário logado.
// Suporta filtros via query string: ?type=income&from=2024-01-01&to=2024-12-31
async function list(req, res) {
  const userId = req.user.id
  const { type, from, to } = req.query

  // Construímos a query dinamicamente para suportar filtros opcionais
  let sql    = 'SELECT id, type, amount, description, date, created_at FROM transactions WHERE user_id = ?'
  let params = [userId]

  if (type === 'income' || type === 'expense') {
    sql += ' AND type = ?'
    params.push(type)
  }
  if (from) {
    sql += ' AND date >= ?'
    params.push(from)
  }
  if (to) {
    sql += ' AND date <= ?'
    params.push(to)
  }

  sql += ' ORDER BY date DESC, id DESC'

  try {
    const [rows] = await pool.execute(sql, params)

    // Calcula totais como conveniência para o frontend
    const summary = rows.reduce(
      (acc, t) => {
        const val = parseFloat(t.amount)
        if (t.type === 'income')  acc.totalIncome  += val
        else                      acc.totalExpense += val
        return acc
      },
      { totalIncome: 0, totalExpense: 0 }
    )
    summary.balance = summary.totalIncome - summary.totalExpense

    return res.json({ transactions: rows, summary })
  } catch (err) {
    console.error('[transactions/list]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// ─── POST /transactions ───────────────────────────────────────
// Cria uma nova transação vinculada ao usuário logado.
async function create(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const { type, amount, description, date } = req.body

  try {
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [userId, type, parseFloat(amount), description || null, date]
    )

    return res.status(201).json({
      message: 'Transação criada com sucesso.',
      transaction: {
        id: result.insertId,
        user_id: userId,
        type,
        amount: parseFloat(amount),
        description: description || null,
        date,
      }
    })
  } catch (err) {
    console.error('[transactions/create]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// ─── PUT /transactions/:id ────────────────────────────────────
// Atualiza uma transação. Verifica que ela pertence ao usuário logado.
async function update(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const txId   = parseInt(req.params.id, 10)

  if (isNaN(txId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  // Verifica a propriedade antes de atualizar (nunca confia só no frontend)
  const [existing] = await pool.execute(
    'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
    [txId, userId]
  )
  if (existing.length === 0) {
    return res.status(404).json({ error: 'Transação não encontrada.' })
  }

  const { type, amount, description, date } = req.body

  try {
    await pool.execute(
      `UPDATE transactions
          SET type = ?, amount = ?, description = ?, date = ?
        WHERE id = ? AND user_id = ?`,
      [type, parseFloat(amount), description || null, date, txId, userId]
    )

    return res.json({ message: 'Transação atualizada com sucesso.' })
  } catch (err) {
    console.error('[transactions/update]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// ─── DELETE /transactions/:id ─────────────────────────────────
// Remove uma transação. Também verifica a propriedade.
async function remove(req, res) {
  const userId = req.user.id
  const txId   = parseInt(req.params.id, 10)

  if (isNaN(txId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  try {
    // O WHERE user_id = ? garante que um usuário não deletar transações alheias
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [txId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' })
    }

    return res.json({ message: 'Transação removida com sucesso.' })
  } catch (err) {
    console.error('[transactions/remove]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

module.exports = { list, create, update, remove }
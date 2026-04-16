const pool = require('../config/db')
const { validationResult } = require('express-validator')

async function list(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const { type, from, to } = req.query

  let sql = 'SELECT id, type, amount, description, date, created_at FROM transactions WHERE user_id = ?'
  const params = [userId]

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
    const summary = rows.reduce(
      (acc, transaction) => {
        const value = parseFloat(transaction.amount)
        if (transaction.type === 'income') acc.totalIncome += value
        else acc.totalExpense += value
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

async function create(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const { type, amount, description, date } = req.body

  try {
    const parsedAmount = parseFloat(amount)
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [userId, type, parsedAmount, description || null, date]
    )

    return res.status(201).json({
      message: 'Transação criada com sucesso.',
      transaction: {
        id: result.insertId,
        user_id: userId,
        type,
        amount: parsedAmount,
        description: description || null,
        date,
      }
    })
  } catch (err) {
    console.error('[transactions/create]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

async function update(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const txId = parseInt(req.params.id, 10)

  if (Number.isNaN(txId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  const { type, amount, description, date } = req.body

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [txId, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' })
    }

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

async function remove(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const txId = parseInt(req.params.id, 10)

  if (Number.isNaN(txId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  try {
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

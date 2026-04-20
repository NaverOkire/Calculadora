const pool = require('../config/db')
const { validationResult } = require('express-validator')

const baseSelect = `
  SELECT id, user_id, name, amount, due_date, is_paid, created_at
    FROM bills_todo
`

async function list(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id

  try {
    const [rows] = await pool.execute(
      `${baseSelect} WHERE user_id = ? ORDER BY is_paid ASC, due_date ASC, id DESC`,
      [userId]
    )

    return res.json({ bills: rows })
  } catch (err) {
    console.error('[bills/list]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

async function create(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const { name, amount, due_date: dueDate } = req.body

  try {
    const [result] = await pool.execute(
      'INSERT INTO bills_todo (user_id, name, amount, due_date) VALUES (?, ?, ?, ?)',
      [userId, name.trim(), Number.parseFloat(amount), dueDate]
    )

    const [rows] = await pool.execute(
      `${baseSelect} WHERE id = ? AND user_id = ?`,
      [result.insertId, userId]
    )

    return res.status(201).json({
      message: 'Conta criada com sucesso.',
      bill: rows[0],
    })
  } catch (err) {
    console.error('[bills/create]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

async function update(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const billId = Number.parseInt(req.params.id, 10)
  const { is_paid: isPaid } = req.body

  if (Number.isNaN(billId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE bills_todo SET is_paid = ? WHERE id = ? AND user_id = ?',
      [Number(isPaid) === 1 ? 1 : 0, billId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conta não encontrada.' })
    }

    const [rows] = await pool.execute(
      `${baseSelect} WHERE id = ? AND user_id = ?`,
      [billId, userId]
    )

    return res.json({
      message: 'Conta atualizada com sucesso.',
      bill: rows[0],
    })
  } catch (err) {
    console.error('[bills/update]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

async function remove(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

  const userId = req.user.id
  const billId = Number.parseInt(req.params.id, 10)

  if (Number.isNaN(billId)) {
    return res.status(400).json({ error: 'ID inválido.' })
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM bills_todo WHERE id = ? AND user_id = ?',
      [billId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conta não encontrada.' })
    }

    return res.json({ message: 'Conta removida com sucesso.' })
  } catch (err) {
    console.error('[bills/remove]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

module.exports = { list, create, update, remove }
